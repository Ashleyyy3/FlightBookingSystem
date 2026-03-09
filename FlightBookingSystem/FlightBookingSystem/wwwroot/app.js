const FLIGHTS_URL = "/api/flights";
const BOOKINGS_URL = "/api/bookings";

/* ---------------- Footer year ---------------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------------- Cookie banner ---------------- */
const cookieBanner = document.getElementById("cookieBanner");
const acceptCookies = document.getElementById("acceptCookies");
const declineCookies = document.getElementById("declineCookies");

if (cookieBanner && acceptCookies && declineCookies) {
    const choice = localStorage.getItem("cookieChoice");
    if (!choice) cookieBanner.classList.remove("hidden");

    acceptCookies.onclick = () => {
        localStorage.setItem("cookieChoice", "accepted");
        cookieBanner.classList.add("hidden");
    };

    declineCookies.onclick = () => {
        localStorage.setItem("cookieChoice", "declined");
        cookieBanner.classList.add("hidden");
    };
}

/* ---------------- Home page search ---------------- */
const homeForm = document.getElementById("homeSearchForm");
if (homeForm) {
    homeForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const from = document.getElementById("homeFrom").value.trim();
        const to = document.getElementById("homeTo").value.trim();

        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        location.href = `flights.html?${params.toString()}`;
    });
}

/* =========================================================
   FLIGHTS PAGE
   ========================================================= */
let allFlights = [];

function isFlightsPage() {
    return document.getElementById("flights") !== null;
}

async function loadFlights() {
    if (!isFlightsPage()) return;

    const flightsEl = document.getElementById("flights");
    const statusEl = document.getElementById("status");

    const fromInput = document.getElementById("fromInput");
    const toInput = document.getElementById("toInput");
    const searchBtn = document.getElementById("searchBtn");
    const resetBtn = document.getElementById("resetBtn");

    const setStatus = (msg) => {
        if (statusEl) statusEl.textContent = msg || "";
    };

    try {
        setStatus("Loading flights...");

        const res = await fetch(FLIGHTS_URL);
        if (!res.ok) return setStatus(`Failed to load flights (${res.status})`);

        allFlights = await res.json();
        setStatus("");

        // Prefill filters from URL (from home page)
        const params = new URLSearchParams(location.search);
        const presetFrom = params.get("from") || "";
        const presetTo = params.get("to") || "";

        if (fromInput) fromInput.value = presetFrom;
        if (toInput) toInput.value = presetTo;

        function renderFlights(list) {
            flightsEl.innerHTML = "";

            if (!list.length) {
                flightsEl.innerHTML = `<div class="card">No flights found.</div>`;
                return;
            }

            list.forEach((f) => {
                const soldOut = f.availableSeats <= 0;

                const div = document.createElement("div");
                div.className = "card";
                div.innerHTML = `
          <div class="row">
            <div class="big">${f.from} → ${f.to}</div>
            <div class="tag">${soldOut ? "SOLD OUT" : `${f.availableSeats} seats`}</div>
          </div>

          <div class="muted" style="margin-top:8px;">
            Departs: ${new Date(f.departureTime).toLocaleString()}
          </div>

          <div style="margin-top:8px;">Price: ${f.price} SEK</div>

          <button class="btn" style="margin-top:12px;" ${soldOut ? "disabled" : ""}>
            ${soldOut ? "Unavailable" : "Book"}
          </button>
        `;

                div.querySelector("button").onclick = () => openBookingDialog(f, setStatus);
                flightsEl.appendChild(div);
            });
        }

        function applyFilter() {
            const fromVal = (fromInput?.value || "").trim().toLowerCase();
            const toVal = (toInput?.value || "").trim().toLowerCase();

            const filtered = allFlights.filter((f) => {
                const okFrom = !fromVal || f.from.toLowerCase().includes(fromVal);
                const okTo = !toVal || f.to.toLowerCase().includes(toVal);
                return okFrom && okTo;
            });

            renderFlights(filtered);
        }

        // Bind buttons once each load (ok for now)
        searchBtn?.addEventListener("click", applyFilter);

        resetBtn?.addEventListener("click", () => {
            if (fromInput) fromInput.value = "";
            if (toInput) toInput.value = "";
            renderFlights(allFlights);
            setStatus("");
            history.replaceState({}, "", "flights.html"); // clears ?from=&to=
        });

        // If user came from home with filters, apply them immediately
        if (presetFrom || presetTo) applyFilter();
        else renderFlights(allFlights);

    } catch (err) {
        console.error(err);
        setStatus("Network error while loading flights.");
    }
}

/* ---- Booking popup (dialog) ---- */
function openBookingDialog(flight, setStatus) {
    const dialog = document.getElementById("bookingDialog");
    if (!dialog) return;

    document.getElementById("selectedFlightId").value = flight.id;
    document.getElementById("selectedFlightText").textContent =
        `${flight.from} → ${flight.to} • ${new Date(flight.departureTime).toLocaleString()} • ${flight.price} SEK`;

    const nameInput = document.getElementById("passengerName");
    const emailInput = document.getElementById("passengerEmail");

    nameInput.value = "";
    emailInput.value = "";

    dialog.showModal();

    document.getElementById("cancelDialogBtn").onclick = () => dialog.close();

    const form = document.getElementById("bookingForm");
    form.onsubmit = async (e) => {
        e.preventDefault();

        const flightId = Number(document.getElementById("selectedFlightId").value);
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email) return;

        dialog.close();
        await bookFlight(flightId, name, email, setStatus);
    };
}

/* ---- Actually POST booking ---- */
async function bookFlight(flightId, name, email, setStatus) {
    try {
        setStatus("Booking...");

        const res = await fetch(BOOKINGS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                flightId,
                passengerName: name,
                email
            })
        });

        if (!res.ok) {
            const msg = await res.text();
            return setStatus(`Booking failed: ${msg}`);
        }

        setStatus("Booked! ✅ Reloading...");
        await loadFlights(); // refresh seat count
        setStatus("Booked! ✅");
    } catch (err) {
        console.error(err);
        setStatus("Network error while booking.");
    }
}

/* =========================================================
   BOOKINGS PAGE
   ========================================================= */
function isBookingsPage() {
    return document.getElementById("bookings") !== null;
}

async function loadBookings() {
    if (!isBookingsPage()) return;

    const bookingsEl = document.getElementById("bookings");
    const statusEl = document.getElementById("bookingsStatus");

    const emailInput = document.getElementById("emailFilter");
    const findBtn = document.getElementById("findBookingsBtn");
    const clearBtn = document.getElementById("clearBookingsBtn");

    const setStatus = (msg) => {
        if (statusEl) statusEl.textContent = msg || "";
    };

    async function fetchBookings() {
        try {
            setStatus("Loading bookings...");
            const res = await fetch(BOOKINGS_URL);
            if (!res.ok) {
                setStatus(`Failed to load bookings (${res.status})`);
                return [];
            }
            const bookings = await res.json();
            setStatus("");
            return bookings;
        } catch (err) {
            console.error(err);
            setStatus("Network error while loading bookings.");
            return [];
        }
    }

    function render(list) {
        bookingsEl.innerHTML = "";

        if (!list.length) {
            bookingsEl.innerHTML = `<div class="card">No bookings found.</div>`;
            return;
        }

        list.forEach((b) => {
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
        <div class="big">${b.passengerName}</div>
        <div class="muted">${b.email}</div>
        <div style="margin-top:6px;">Status: ${b.status}</div>
        <div class="muted" style="margin-top:6px;">FlightId: ${b.flightId}</div>
      `;
            bookingsEl.appendChild(div);
        });
    }

    let all = await fetchBookings();
    render(all);

    findBtn?.addEventListener("click", () => {
        const email = (emailInput?.value || "").trim().toLowerCase();
        if (!email) return render(all);

        const filtered = all.filter((b) => (b.email || "").toLowerCase() === email);
        render(filtered);
    });

    clearBtn?.addEventListener("click", () => {
        if (emailInput) emailInput.value = "";
        render(all);
        setStatus("");
    });
}

/* ---------------- Run depending on page ---------------- */
loadFlights();
loadBookings();
