using FlightBookingSystem.Models;
using FligtBookingSystem.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlightBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private static List<Booking> bookings = new();

        [HttpPost]
        public IActionResult CreateBooking(Booking booking)
        {
            var flight = FlightsController.Flights
                .FirstOrDefault(f => f.Id == booking.FlightId);

            if (flight == null)
                return NotFound("Flight not found");

            if (flight.AvailableSeats <= 0)
                return BadRequest("No seats available");

            flight.AvailableSeats--;

            booking.Id = bookings.Count + 1;
            booking.BookingDate = DateTime.Now;
            booking.Status = "Confirmed";

            bookings.Add(booking);

            return Ok(booking);
        }

        [HttpGet]
        public List<Booking> GetBookings()
        {
            return bookings;
        }
    }
}
