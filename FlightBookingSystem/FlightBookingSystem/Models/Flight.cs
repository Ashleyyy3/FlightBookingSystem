namespace FlightBookingSystem.Models
{
    public class Flight
    {
        // every flight must have the following
        public int Id { get; set; }

        public string From { get; set; } = "";

        public string To { get; set; } = "";

        public DateTime DepartureTime { get; set; }

        public decimal Price { get; set; }

        public int TotalSeats { get; set; }

        public int AvailableSeats { get; set; }
    }
}
