// Request body accepted by POST /api/customerDetail today.
export function customerInput(overrides = {}) {
  return {
    customer_name: "Ali Raza",
    customer_contact: "0300-1234567",
    customer_waist: "32",
    customer_bust: "38",
    customer_upperArm: "12",
    customer_neckToSleeve: "30",
    customer_back: "16",
    customer_neckToShoulder: "7",
    customer_legLength: "40",
    customer_upperPocket: true,
    customer_dressDesign: "Kurta",
    customer_neckStyle: "Ban",
    customer_orderPrice: "2500",
    customer_orderStatus: "Pending",
    customer_paymentStatus: "Pending",
    customer_noOfSuits: "2",
    ...overrides,
  };
}
