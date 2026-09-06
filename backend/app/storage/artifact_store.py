import os
import hashlib
import json
from abc import ABC, abstractmethod
from typing import BinaryIO, AsyncIterator
from app.config import settings

class ArtifactStore(ABC):
    @abstractmethod
    async def put_artifact(self, run_id: str, artifact_name: str, content: bytes | str) -> dict:
        """Stores an artifact and returns {path, checksum, size_bytes}"""
        pass

    @abstractmethod
    async def get_artifact(self, storage_path: str) -> bytes:
        """Retrieves raw bytes of an artifact"""
        pass

    @abstractmethod
    async def list_artifacts(self, run_id: str) -> list[dict]:
        """Lists artifacts for a run"""
        pass

class LocalArtifactStore(ArtifactStore):
    def __init__(self, base_path: str = settings.ARTIFACT_STORAGE_PATH):
        self.base_path = os.path.abspath(base_path)
        os.makedirs(self.base_path, exist_ok=True)

    async def put_artifact(self, run_id: str, artifact_name: str, content: bytes | str) -> dict:
        run_dir = os.path.join(self.base_path, run_id)
        os.makedirs(run_dir, exist_ok=True)
        
        file_path = os.path.join(run_dir, artifact_name)
        
        if isinstance(content, str):
            data = content.encode("utf-8")
        else:
            data = content

        checksum = hashlib.sha256(data).hexdigest()
        size_bytes = len(data)

        with open(file_path, "wb") as f:
            f.write(data)

        rel_path = os.path.relpath(file_path, self.base_path).replace("\\", "/")
        return {
            "path": rel_path,
            "checksum": checksum,
            "size_bytes": size_bytes,
            "absolute_path": file_path
        }

    async def get_artifact(self, storage_path: str) -> bytes:
        full_path = os.path.join(self.base_path, storage_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Artifact not found at {storage_path}")
        with open(full_path, "rb") as f:
            return f.read()

    async def list_artifacts(self, run_id: str) -> list[dict]:
        run_dir = os.path.join(self.base_path, run_id)
        if not os.path.exists(run_dir):
            return []
        
        results = []
        for root, _, files in os.walk(run_dir):
            for file in files:
                fpath = os.path.join(root, file)
                rel_path = os.path.relpath(fpath, self.base_path).replace("\\", "/")
                with open(fpath, "rb") as f:
                    content = f.read()
                results.append({
                    "name": file,
                    "path": rel_path,
                    "size_bytes": len(content),
                    "checksum": hashlib.sha256(content).hexdigest()
                })
        return results

# Singleton instance
artifact_store = LocalArtifactStore()
