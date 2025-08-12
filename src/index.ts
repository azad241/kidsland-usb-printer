import { serve } from '@hono/node-server'
import { randomUUID } from 'crypto';
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { createRequire } from 'module';
import { getTicketTypeDisplay } from './functions.js';

// Use createRequire to import CommonJS modules in ES modules
const require = createRequire(import.meta.url);
const escpos = require('escpos');
escpos.USB = require('@node-escpos/usb-adapter');
// const device = new escpos.USB();
// const printer = new escpos.Printer(device, { encoding: "GB18030" });

// Create a printer connection on demand
function getPrinter() {
  try {
    const device = new escpos.USB()
    const printer = new escpos.Printer(device, { encoding: 'GB18030' })
    return { device, printer }
  } catch (err) {
    console.error('Could not connect to printer:', err)
    return null
  }
}

function printTestReceipt() {
  const conn = getPrinter()
  if (!conn) return false

  const { device, printer } = conn
  device.open(() => {
    printer
      .align('CT')
      .size(1, 1)
      .text('KidsLand Test Print')
      .size(0, 0)
      .text(new Date().toLocaleString())
      .feed(2)
      .cut()
      .close()
  })

  return true
}

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://kidsland.com.bd', 'https://shop.kidsland.com.bd', 'https://food.kidsland.com.bd'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE'],
    exposeHeaders: ['*'],
    maxAge: 600,
    credentials: true,
  })
);

//print ticket
const ticketPrint = (ticket: any, printer: typeof escpos.Printer) => {
  const currentTime = new Date().toLocaleString()
  const validUntil = new Date(Date.now() + 60 * 60 * 1000).toLocaleString()

  // console.log(ticket)
  return printer
    .align('CT')
    .size(1, 1)
    .text('KidsLand')
    .size(0, 0)
    .text('Bali Arcade, Level-5, Food Court')
    .text('Chawkbazar, Chittagong')
    .drawLine()
    .align('LT')
    .text(`Receipt #${ticket.transactionId}`)
    .text(`Entry ID: ${ticket.id % 1000}`)
    .text(`Valid From: ${currentTime}`)
    .text(`Valid Until: ${validUntil}`)
    .drawLine()
    .text(`Customer: ${ticket.customerName}`)
    .text(`Phone: ${ticket.customerPhone}`)
    .text(`Ticket Type: ${getTicketTypeDisplay(ticket.type)}`)
    .text(
      `Tickets: ${ticket.numberOfTickets}${ticket.type === 'offer' ? ' x (1 Holidays, 2 Standard)' : ''
      }`
    )
    .text(
      ticket.type === 'offer'
        ? `= ${3 * ticket.numberOfTickets} (${ticket.numberOfTickets} Holidays, ${2 * ticket.numberOfTickets
        } Standard)`
        : ''
    )
    .text(`Date: ${ticket.purchaseDate}`)
    .drawLine()
    .align('RT')
    .size(1, 1)
    .text(`Total: ${ticket?.price?.toFixed(0)}`)
    .feed(1)
    .size(0, 0)
    .align('CT')
    .text('Thank you for your visit!')
    .text('Please come again')
    .feed(3)
    .cut()
}

app.post('/print-ticket', async (c) => {
  const conn = getPrinter()
  if (!conn) return c.text('Printer not connected', 500)

  const { device, printer } = conn
  try {
    const ticket = await c.req.json()

    return await new Promise((resolve, reject) => {
      device.open(() => {
        try {
          ticketPrint(ticket, printer)
          printer.close()
          resolve(c.json({ success: true, message: 'Ticket printed successfully' }))
        } catch (err) {
          reject(c.json({ success: false, error: err }))
        }
      })
    })
  } catch (error) {
    console.error('Print error:', error)
    return c.json({ error: 'Print failed', message: error }, 500)
  }
})

//print membership
const membershipPrint = (membership: any, printer: typeof escpos.printer) => {
  const currentTime = new Date().toLocaleString();

  return printer
    .align('CT')
    .size(1, 1)
    .text('KidsLand')
    .size(0, 0)
    .text('Bali Arcade, Level-5, Food Court')
    .text('Chawkbazar, Chittagong')
    .drawLine()
    .align('LT')
    .text(`Receipt #${membership.transactionId}`)
    .text(`Entry ID: ${membership.id % 1000}`)
    .text(`Valid From: ${currentTime}`)
    .drawLine()
    .text(`Guardian: ${membership.guardianName}`)
    .text(`Phone: ${membership.guardianPhone}`)
    .text(`Child: ${membership.childName ?? 'N/A'} (Age: ${membership.childAge ?? 'N/A'})`)
    .text(`Memberships: ${membership.numberOfMemberships}`)
    .text(`Date: ${membership.purchaseDate}`)
    .drawLine()
    .align('RT')
    .size(1, 1)
    .text(`Total: ${membership?.price?.toFixed(0)}`)
    .feed(1)
    .size(0, 0)
    .align('CT')
    .text('Thank you for your visit!')
    .text('Please come again')
    .feed(3)
    .cut();
};
app.post('/print-membership', async (c) => {
  const conn = getPrinter()
  if (!conn) return c.text('Printer not connected', 500)

  const { device, printer } = conn
  try {
    const membership = await c.req.json()

    return await new Promise((resolve, reject) => {
      device.open(() => {
        try {
          membershipPrint(membership, printer)
          printer.close()
          resolve(c.json({ success: true, message: 'Ticket printed successfully' }))
        } catch (err) {
          reject(c.json({ success: false, error: err }))
        }
      })
    })
  } catch (error) {
    console.error('Print error:', error)
    return c.json({ error: 'Print failed', message: error }, 500)
  }
})

//shop
const shopPrint = (order: any, printer: typeof escpos.printer) => {
  const currentTime = new Date().toLocaleString();

  printer
    .align('CT')
    .size(1, 1)
    .text('KidsLand Shop')
    .size(0, 0)
    .text('Bali Arcade, Level-5, Food Court')
    .text('Chawkbazar, Chittagong')
    .drawLine()
    .align('LT')
    .text(`Receipt #${order.id}`)
    .text(currentTime)
    .drawLine()
    .text(`Salesman: ${order.salesmanName}`)
    .drawLine();

  // Print each order item
  order.items.forEach((item: any) => {
    printer
      .text(`${item.name}`)
      .text(`   Qty: ${item.quantity}  Unit: ${item.price}  Sub: ${(item.price * item.quantity).toFixed(2)}`);
  });

  printer.drawLine()
    .align('RT')
    .text(`Subtotal: ${order.total.toFixed(2)}`);

  if (order.discount > 0) {
    printer.text(
      `Discount (${order.discount}%): -${(order.total - order.grandTotal).toFixed(2)}`
    );
  }

  printer
    .size(1, 1)
    .text(`Total: ${order.grandTotal.toFixed(2)}`)
    .size(0, 0)
    .feed(1)
    .align('CT')
    .barcode(`ORDER-${order.id} @ kidsland`, 80) // Code128 default, 80px height
    .feed(1)
    .text('Thank you for your visit!')
    .text('Please come again')
    .feed(3)
    .cut();
};
app.post('/print-shop', async (c) => {
  const conn = getPrinter()
  if (!conn) return c.text('Printer not connected', 500)

  const { device, printer } = conn
  try {
    const shop = await c.req.json()

    return await new Promise((resolve, reject) => {
      device.open(() => {
        try {
          shopPrint(shop, printer)
          printer.close()
          resolve(c.json({ success: true, message: 'Ticket printed successfully' }))
        } catch (err) {
          reject(c.json({ success: false, error: err }))
        }
      })
    })
  } catch (error) {
    console.error('Print error:', error)
    return c.json({ error: 'Print failed', message: error }, 500)
  }
})

//resturant
const foodPrint = (order: any, printer: typeof escpos.printer) => {
  const currentTime = new Date().toLocaleString();

  printer
    .align('CT')
    .size(1, 1)
    .text('KidsLand Food Court')
    .size(0, 0)
    .text('Bali Arcade, Level-5, Food Court')
    .text('Chawkbazar, Chittagong')
    .drawLine()
    .align('LT')
    .text(`Receipt #${order.id}`)
    .text(currentTime)
    .drawLine();

  printer.text(`Item                Qty   Price   Subtotal`);
  printer.drawLine();

  order.items.forEach((item: any) => {
    const name = item.name.length > 18 ? item.name.slice(0, 18) : item.name.padEnd(18, ' ');
    const qty = String(item.quantity).padStart(3, ' ');
    const price = item.price.toFixed(0).padStart(6, ' ');
    const subtotal = (item.price * item.quantity).toFixed(0).padStart(8, ' ');
    printer.text(`${name}${qty}${price}${subtotal}`);
  });

  printer.drawLine()
    .align('RT')
    .text(`Subtotal: ${order.total.toFixed(0)}`);

  if (order.discount > 0) {
    printer.text(
      `Discount (${order.discount}%): -${(order.total - order.grandTotal).toFixed(0)}`
    );
  }

  printer
    .size(1, 1)
    .text(`Total: ${order.grandTotal.toFixed(0)}`)
    .size(0, 0)
    .feed(1)
    .align('CT')
    .barcode(`ORDER-${order.id} @ kidsland`, 80) // Code128 default, height 80
    .feed(1)
    .text('Thank you for your visit!')
    .text('Please come again')
    .feed(3)
    .cut();
};

app.post('/print-food', async (c) => {
  const conn = getPrinter()
  if (!conn) return c.text('Printer not connected', 500)

  const { device, printer } = conn
  try {
    const food = await c.req.json()

    return await new Promise((resolve, reject) => {
      device.open(() => {
        try {
          foodPrint(food, printer)
          printer.close()
          resolve(c.json({ success: true, message: 'Ticket printed successfully' }))
        } catch (err) {
          reject(c.json({ success: false, error: err }))
        }
      })
    })
  } catch (error) {
    console.error('Print error:', error)
    return c.json({ error: 'Print failed', message: error }, 500)
  }
})


const printReceiptContent = (printer: typeof escpos.Printer, uuid: string) => {
  return printer
    .text('Phone: 01767506051')
    .text(uuid)
    .text('Date: 08.08.2025')
    .feed(1)
    .cut();
}

app.get('/api/print', async (c) => {
  const conn = getPrinter()
  if (!conn) return c.text('Printer not connected', 500)

  const { device, printer } = conn
  try {

    device.open(() => {
      const uuid = randomUUID();

      device.open(() => {
        // Print first copy
        printReceiptContent(printer, uuid);
        // Print second copy
        printReceiptContent(printer, uuid);

        printer.close();
      })
    })

    return c.text('Printed successfully');
  } catch (error) {
    console.error('Print error:', error);
    return c.json({ error: 'Print failed', message: error }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})