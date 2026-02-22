import logging

logger = logging.getLogger(__name__)


class OCRService:
    """Deprecated OCR service retained for backward compatibility."""

    async def extract_text(self, image_bytes: bytes) -> str:
        """Gemini-first flow no longer uses OCR extraction."""
        logger.info("OCR service is deprecated; returning empty text")
        return ""

    async def extract_from_document(self, document_bytes: bytes) -> dict:
        """Extract structured data from document image"""
        text = await self.extract_text(document_bytes)

        # Try to extract common fields
        return {
            "raw_text": text,
            "detected_fields": self._extract_fields(text)
        }

    def _extract_fields(self, text: str) -> dict:
        """Extract common invoice/document fields"""
        import re

        fields = {}

        # Try to find product descriptions, model numbers, etc.
        model_match = re.search(r"Model[:\s]+([A-Z0-9\-]+)", text, re.IGNORECASE)
        if model_match:
            fields["model"] = model_match.group(1)

        # Find potential HS codes already in document
        hs_match = re.search(r"\b(\d{4}\.\d{2}(?:\.\d{2})?)\b", text)
        if hs_match:
            fields["existing_hs_code"] = hs_match.group(1)

        return fields


ocr_service = OCRService()
