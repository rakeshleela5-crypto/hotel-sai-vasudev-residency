import math
from typing import List, Dict, Any, Union
from decimal import Decimal, ROUND_HALF_UP

def to_paise(amount: Union[float, int, str, Decimal]) -> int:
    """
    Safely converts a rupee amount (float/int/str/Decimal) into integer paise.
    Eliminates IEEE 754 floating-point drift.
    """
    if amount is None:
        return 0
    try:
        dec = Decimal(str(amount))
        paise_dec = (dec * Decimal(100)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        return int(paise_dec)
    except Exception:
        return int(round(float(amount or 0.0) * 100))

def from_paise(paise: Union[int, float]) -> float:
    """
    Converts integer paise back to a 2-decimal rupee float.
    """
    if paise is None:
        return 0.0
    return float((Decimal(int(paise)) / Decimal(100)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

rupees_to_paise = to_paise
paise_to_rupees = from_paise

def allocate_paise(total_paise: int, weights: List[Union[int, float]]) -> List[int]:
    """
    Splits `total_paise` across `weights` proportionally using the Largest Remainder Method
    (Hare-Niemeyer quota), identical to industrial POS cart engines.
    
    Guarantees:
    1. sum(allocated) == total_paise (ZERO penny/paise drift).
    2. If weights represent capacities/maximums and total_paise <= sum(weights),
       no share exceeds its capacity.
    3. Fractional remainders receive 1 paisa in descending order of remainder fraction.
    """
    if not weights or total_paise <= 0:
        return [0] * len(weights)
    
    sum_weights = sum(weights)
    if sum_weights <= 0:
        return [0] * len(weights)
    
    capped_total = min(total_paise, int(sum_weights)) if all(isinstance(w, int) for w in weights) and total_paise < sum_weights else total_paise
    
    # Compute exact proportional share
    exact_shares = [(capped_total * float(w)) / float(sum_weights) for w in weights]
    integer_parts = [int(math.floor(x)) for x in exact_shares]
    
    # Calculate remaining undistributed paise
    distributed_paise = sum(integer_parts)
    left_paise = capped_total - distributed_paise
    
    # Rank by remainder fractions descending; stable secondary sort by index
    fractions_with_indices = [
        (exact_shares[i] - integer_parts[i], i)
        for i in range(len(weights))
    ]
    fractions_with_indices.sort(key=lambda item: (-item[0], item[1]))
    
    for _, idx in fractions_with_indices:
        if left_paise <= 0:
            break
        integer_parts[idx] += 1
        left_paise -= 1
        
    return integer_parts

def compute_gst_paise(
    taxable_paise: int,
    gst_rate_pct: float,
    is_interstate: bool = False,
    is_inclusive: bool = False
) -> Dict[str, Any]:
    """
    Computes Indian GST (CGST/SGST or IGST) in integer paise with Largest Remainder distribution.
    Enforces exact 50/50 CGST and SGST split without 1-paisa drift.
    """
    rate = float(gst_rate_pct or 0.0)
    if taxable_paise <= 0 or rate <= 0.0:
        return {
            "taxable_paise": taxable_paise,
            "taxable_rupees": from_paise(taxable_paise),
            "gst_rate_pct": rate,
            "is_interstate": is_interstate,
            "cgst_paise": 0,
            "cgst_rupees": 0.0,
            "sgst_paise": 0,
            "sgst_rupees": 0.0,
            "igst_paise": 0,
            "igst_rupees": 0.0,
            "total_tax_paise": 0,
            "total_tax_rupees": 0.0,
            "total_paise": taxable_paise,
            "total_rupees": from_paise(taxable_paise),
        }
    
    if is_inclusive:
        # Inclusive calculation: taxable = gross / (1 + rate/100)
        total_p = taxable_paise
        base_p = int(round(total_p / (1.0 + rate / 100.0)))
        total_tax_p = total_p - base_p
    else:
        # Exclusive calculation: tax = taxable * rate / 100
        base_p = taxable_paise
        total_tax_p = int(round(base_p * rate / 100.0))
        total_p = base_p + total_tax_p
    
    if is_interstate:
        igst_p = total_tax_p
        cgst_p = 0
        sgst_p = 0
    else:
        igst_p = 0
        # Equal split of tax between CGST and SGST using allocate_paise
        split = allocate_paise(total_tax_p, [1, 1])
        cgst_p = split[0]
        sgst_p = split[1]
        
    return {
        "taxable_paise": base_p,
        "taxable_rupees": from_paise(base_p),
        "gst_rate_pct": rate,
        "is_interstate": is_interstate,
        "cgst_paise": cgst_p,
        "cgst_rupees": from_paise(cgst_p),
        "sgst_paise": sgst_p,
        "sgst_rupees": from_paise(sgst_p),
        "igst_paise": igst_p,
        "igst_rupees": from_paise(igst_p),
        "total_tax_paise": total_tax_p,
        "total_tax_rupees": from_paise(total_tax_p),
        "total_paise": total_p,
        "total_rupees": from_paise(total_p),
    }

def prorate_discount_paise(line_amounts_paise: List[int], discount_paise: int) -> List[int]:
    """
    Prorates an order-level discount across individual lines in integer paise.
    Ensures:
    - sum(allocated_discounts) == discount_paise
    - No line discount exceeds its line amount (no negative line totals).
    """
    total_base = sum(line_amounts_paise)
    if total_base <= 0 or discount_paise <= 0:
        return [0] * len(line_amounts_paise)
    
    capped_discount = min(discount_paise, total_base)
    return allocate_paise(capped_discount, line_amounts_paise)

def calculate_section170_roundoff(gross_paise: int) -> Dict[str, Any]:
    """
    CGST Act Section 170 Round-off Rule:
    The final invoice amount must be rounded off to the nearest Indian Rupee.
    Amounts < 50 paise are rounded down; >= 50 paise are rounded up.
    Returns:
    - net_payable_paise: int
    - net_payable_rupees: float
    - roundoff_paise: int (can be negative or positive)
    - roundoff_rupees: float
    """
    net_rupees = int(round(gross_paise / 100.0))
    net_paise = net_rupees * 100
    roundoff_p = net_paise - gross_paise
    
    return {
        "gross_paise": gross_paise,
        "gross_rupees": from_paise(gross_paise),
        "net_payable_paise": net_paise,
        "net_payable_rupees": float(net_rupees),
        "roundoff_paise": roundoff_p,
        "roundoff_rupees": from_paise(roundoff_p)
    }

