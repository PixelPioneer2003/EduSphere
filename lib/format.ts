export const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0 // Optional: Removes decimal part for whole numbers
    }).format(price);
}

  