import logging
from typing import AsyncIterator
from app.execution.interface import Executor, StepSubmission, StepStatus

logger = logging.getLogger("reprovia.k8s")

class KubernetesExecutor(Executor):
    """
    Production-grade Kubernetes Executor interfacing with the official Kubernetes API.
    Deploys each workflow step as an isolated Kubernetes Job in a designated namespace.
    """

    def __init__(self):
        self._k8s_available = False
        try:
            from kubernetes import client, config
            try:
                config.load_incluster_config()
                self._k8s_available = True
            except Exception:
                try:
                    config.load_kube_config()
                    self._k8s_available = True
                except Exception:
                    self._k8s_available = False
            
            if self._k8s_available:
                self.batch_v1 = client.BatchV1Api()
                self.core_v1 = client.CoreV1Api()
                logger.info("KubernetesExecutor initialized with valid cluster configuration.")
            else:
                logger.warning("No Kubernetes cluster configuration found. Local mock executor recommended.")
        except Exception as e:
            logger.error(f"Error initializing Kubernetes client: {e}")
            self._k8s_available = False

    async def submit(self, spec: StepSubmission) -> str:
        if not self._k8s_available:
            raise RuntimeError(
                "Kubernetes API is not reachable. Ensure kubeconfig is loaded or set EXECUTION_MODE=mock."
            )

        from kubernetes import client
        job_name = f"reprovia-{spec.step_name.lower().replace('_', '-')}-{spec.run_id[:8]}"

        # Define Resource Requirements
        resources = client.V1ResourceRequirements(
            requests={
                "cpu": spec.resources.get("cpu_request", "500m"),
                "memory": spec.resources.get("memory_request", "512Mi")
            },
            limits={
                "cpu": spec.resources.get("cpu_limit", "1000m"),
                "memory": spec.resources.get("memory_limit", "1Gi")
            }
        )

        # Environment variables
        env_list = [
            client.V1EnvVar(name=k, value=str(v))
            for k, v in spec.env.items()
        ]
        env_list.append(client.V1EnvVar(name="REPROVIA_RUN_ID", value=spec.run_id))
        env_list.append(client.V1EnvVar(name="REPROVIA_STEP_NAME", value=spec.step_name))

        # Container Spec
        container = client.V1Container(
            name=f"step-{spec.step_name.lower()}",
            image=spec.image,
            command=["sh", "-c", spec.command],
            resources=resources,
            env=env_list
        )

        # Pod Template Spec
        template = client.V1PodTemplateSpec(
            metadata=client.V1ObjectMeta(
                labels={
                    "app.kubernetes.io/name": "reprovia-job",
                    "reprovia.io/run-id": spec.run_id,
                    "reprovia.io/step-name": spec.step_name
                }
            ),
            spec=client.V1PodSpec(
                restart_policy="Never",
                containers=[container]
            )
        )

        # Job Spec
        job_spec = client.V1JobSpec(
            template=template,
            backoff_limit=2,
            active_deadline_seconds=spec.timeout_seconds
        )

        job = client.V1Job(
            api_version="batch/v1",
            kind="Job",
            metadata=client.V1ObjectMeta(
                name=job_name,
                namespace=spec.namespace,
                labels={"reprovia.io/managed-by": "reprovia-engine"}
            ),
            spec=job_spec
        )

        try:
            self.batch_v1.create_namespaced_job(namespace=spec.namespace, body=job)
            return job_name
        except Exception as err:
            logger.error(f"Failed to create Kubernetes Job: {err}")
            raise

    async def get_status(self, job_identifier: str, namespace: str = "reprovia-workloads") -> StepStatus:
        if not self._k8s_available:
            return StepStatus(
                step_name=job_identifier,
                status="FAILED",
                error_message="Kubernetes cluster unreachable"
            )

        try:
            job = self.batch_v1.read_namespaced_job_status(name=job_identifier, namespace=namespace)
            status_obj = job.status

            if status_obj.succeeded and status_obj.succeeded > 0:
                return StepStatus(step_name=job_identifier, status="COMPLETED", exit_code=0, job_name=job_identifier)
            elif status_obj.failed and status_obj.failed > 0:
                return StepStatus(step_name=job_identifier, status="FAILED", exit_code=1, job_name=job_identifier)
            elif status_obj.active and status_obj.active > 0:
                return StepStatus(step_name=job_identifier, status="RUNNING", job_name=job_identifier)
            else:
                return StepStatus(step_name=job_identifier, status="STARTING", job_name=job_identifier)
        except Exception as e:
            return StepStatus(step_name=job_identifier, status="FAILED", error_message=str(e))

    async def get_logs(self, job_identifier: str, namespace: str = "reprovia-workloads", follow: bool = False) -> AsyncIterator[dict]:
        if not self._k8s_available:
            return

        try:
            pods = self.core_v1.list_namespaced_pod(
                namespace=namespace,
                label_selector=f"job-name={job_identifier}"
            )
            if not pods.items:
                return

            pod_name = pods.items[0].metadata.name
            raw_logs = self.core_v1.read_namespaced_pod_log(name=pod_name, namespace=namespace)
            for line in raw_logs.splitlines():
                yield {
                    "stream": "stdout",
                    "timestamp": "",
                    "message": line
                }
        except Exception as e:
            logger.error(f"Error fetching k8s logs for {job_identifier}: {e}")

    async def cancel(self, job_identifier: str, namespace: str = "reprovia-workloads") -> bool:
        if not self._k8s_available:
            return False
        from kubernetes import client
        try:
            self.batch_v1.delete_namespaced_job(
                name=job_identifier,
                namespace=namespace,
                propagation_policy="Background"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to cancel k8s job {job_identifier}: {e}")
            return False
