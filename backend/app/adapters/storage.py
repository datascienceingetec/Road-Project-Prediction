from typing import Protocol
from pathlib import Path
from google.cloud import storage
import logging

logger = logging.getLogger(__name__)


class StorageProtocol(Protocol):
    """
    Protocol defining the interface for storage operations.
    Focuses on binary data persistence.
    """

    def save(self, filename: str, data: bytes) -> str:
        """
        Save binary data to storage.
        Returns the path/url/identifier of the saved resource.
        """
        ...

    def load(self, filename: str) -> bytes:
        """
        Load binary data from storage.
        Raises FileNotFoundError or similar if not found.
        """
        ...

    def exists(self, filename: str) -> bool:
        """
        Check if file exists in storage.
        """
        ...


class LocalStorage(StorageProtocol):
    """
    Implementation of StorageProtocol for local filesystem.
    """

    def __init__(self, base_path: str = "data/models"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, filename: str, data: bytes) -> str:
        filepath = self.base_path / filename
        with open(filepath, 'wb') as f:
            f.write(data)
        logger.info(f"Saved {len(data)} bytes to local file: {filepath}")
        return str(filepath)

    def load(self, filename: str) -> bytes:
        filepath = self.base_path / filename
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
        with open(filepath, 'rb') as f:
            return f.read()

    def exists(self, filename: str) -> bool:
        return (self.base_path / filename).exists()


class GCSStorage(StorageProtocol):
    """
    Implementation of StorageProtocol for Google Cloud Storage.
    """

    def __init__(self, bucket_name: str, folder_prefix: str = "models"):
        self.bucket_name = bucket_name
        self.folder_prefix = folder_prefix
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)
        logger.info(f"Initialized GCSStorage with bucket: {bucket_name}")

    def _get_blob_name(self, filename: str) -> str:
        return f"{self.folder_prefix}/{filename}" if self.folder_prefix else filename

    def save(self, filename: str, data: bytes) -> str:
        blob_name = self._get_blob_name(filename)
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(data)
        logger.info(
            f"Uploaded {len(data)} bytes to gs://{self.bucket_name}/{blob_name}")
        return f"gs://{self.bucket_name}/{blob_name}"

    def load(self, filename: str) -> bytes:
        blob_name = self._get_blob_name(filename)
        blob = self.bucket.blob(blob_name)
        if not blob.exists():
            raise FileNotFoundError(
                f"Blob not found: gs://{self.bucket_name}/{blob_name}")
        return blob.download_as_bytes()

    def exists(self, filename: str) -> bool:
        blob_name = self._get_blob_name(filename)
        blob = self.bucket.blob(blob_name)
        return blob.exists()
