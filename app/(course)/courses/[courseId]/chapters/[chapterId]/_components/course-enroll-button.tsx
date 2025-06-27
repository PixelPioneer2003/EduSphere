"use client";

import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface CourseEnrollButtonProps {
  price: number;
  courseId: string;
}

export const CourseEnrollButton = ({
  price,
  courseId,
}: CourseEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      const response = await axios.post(`/api/courses/${courseId}/checkout`);
      const { id, amount, currency } = response.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amount,
        currency: currency,
        name: "Course Purchase",
        description: "Course Purchase",
        order_id: id,
        handler: async (paymentResponse: any) => {
          try {
            await axios.post(`/api/courses/${courseId}/checkout/verify`, {
              ...paymentResponse,
              courseId,
            });
            toast.success("Payment Successful!");
            window.location.href = `/courses/${courseId}?success=1`;
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment Cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Razorpay Script added in the same component */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <Button
        onClick={onClick}
        disabled={isLoading}
        size="sm"
        className="w-full md:w-auto"
      >
        Enroll for {formatPrice(price)}
      </Button>
    </>
  );
};
