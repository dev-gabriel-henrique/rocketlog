import { z } from "zod"
import { Request, Response } from "express";

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError";

class DeliveryLogsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      delivery_id: z.string().uuid(),
      description: z.string()
    })

    const { delivery_id, description } = bodySchema.parse(request.body)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id }
    })

    if (!delivery) {
      throw new AppError("Delivery not found!", 401)
    }

    if (delivery.status === "delivered") {
      throw new AppError("This order has already been delivered!")
    }

    if (delivery.status === "processing") {
      throw new AppError("Change status to shipped!")
    }

    await prisma.deliveryLog.create({
      data: {
        deliveryId: delivery_id,
        description
      }
    })

    return response.status(201).json()
  }

  async show(request: Request, response: Response) {
    const paramsSchema = z.object({
      delivery_id: z.string().uuid(),
    })

    const { delivery_id } = paramsSchema.parse(request.params)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id},

      include: {
        user: true,
        logs: true,
      }
    })

    if (!delivery) {
      return response.status(404).json({ message: "Delivery not found"})
    }

    if (request.user?.role === "customer" 
      && request.user?.id !== delivery?.userId
    ) {
      throw new AppError("The user can only view their deliveries", 401)
    }

    return response.json(delivery)
  }
}

export { DeliveryLogsController }