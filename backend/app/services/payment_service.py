"""KalaHaat – payment provider interface + mock.

Implements the PaymentProvider protocol with a MockProvider that always
succeeds (or fails for a magic card number) – per payment workflow specification.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Protocol


@dataclass
class PaymentResult:
    success: bool
    provider: str
    ref: str  # provider reference / transaction id
    message: str = ""


class PaymentProvider(Protocol):
    """Interface – swap in Razorpay or Stripe without touching order logic."""

    def charge(self, amount_inr: float, method: str, metadata: dict | None = None) -> PaymentResult:
        ...


class MockProvider:
    """Demo payment provider.

    - Always succeeds for ``mock_upi`` and ``mock_cod``.
    - Fails if ``method == "mock_card"`` and ``metadata.get("card_number")``
      equals the magic failure number ``"4000000000000002"`` (Stripe-convention
      for test-decline).
    """

    FAIL_CARD = "4000000000000002"

    def charge(
        self, amount_inr: float, method: str, metadata: dict | None = None
    ) -> PaymentResult:
        metadata = metadata or {}
        ref = f"MOCK-{uuid.uuid4().hex[:12].upper()}"

        if method == "mock_card" and metadata.get("card_number") == self.FAIL_CARD:
            return PaymentResult(
                success=False,
                provider="mock",
                ref=ref,
                message="Card declined (test failure path)",
            )

        return PaymentResult(
            success=True,
            provider="mock",
            ref=ref,
            message=f"Mock {method} payment of ₹{amount_inr:.2f} succeeded",
        )


# Module-level singleton; import and use directly.
payment_provider: PaymentProvider = MockProvider()
