using FlightBookingSystem.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FligtBookingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlightsController : ControllerBase
    {
        
        public static List<Flight> Flights = new ()
        {

                new Flight
                {
                    Id = 1,
                    From = "Stockholm",
                    To = "London",
                    DepartureTime = DateTime.Now.AddDays(1),
                    Price = 1200,
                    TotalSeats = 100,
                    AvailableSeats = 50
                },
                new Flight
                {
                    Id = 2,
                    From = "Gothenburg",
                    To = "Paris",
                    DepartureTime = DateTime.Now.AddDays(2),
                    Price = 900,
                    TotalSeats = 80,
                    AvailableSeats = 20
                }
            };


        [HttpGet]
        public List<Flight> GetFlights()
        {
            return Flights;
        }

    }
    
}