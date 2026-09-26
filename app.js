const firebaseConfig = {
  apiKey: "AIzaSyAPnqNfRwqxRTvd4jl8lkut0BUd30Lwf6I",
  authDomain: "flight-ticket-booking-e7b6c.firebaseapp.com",
  projectId: "flight-ticket-booking-e7b6c",
  storageBucket: "flight-ticket-booking-e7b6c.firebasestorage.app",
  messagingSenderId: "548727356939",
  appId: "1:548727356939:web:8be862834e2e8152b1510e",
  measurementId: "G-3HY5Y88LRS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchForm = document.getElementById('search-form');
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');
    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results-section');
    const flightsList = document.getElementById('flights-list');
    const searchMeta = document.getElementById('search-meta');
    
    // Modal Elements
    const bookingModal = document.getElementById('booking-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const bookingForm = document.getElementById('booking-form');
    const cabinClassOptions = document.getElementById('cabin-class-options');
    const totalPriceEl = document.getElementById('total-price');
    const successToast = document.getElementById('success-toast');
    const modalFlightNumber = document.getElementById('modal-flight-number');
    const modalFlightSummary = document.getElementById('modal-flight-summary');
    
    // State
    let selectedFlight = null;
    let selectedClassIndex = 0; // 0=Economy, 1=Business, 2=First
    let basePrice = 0;

    // Set minimum date for search to today
    const dateInput = document.getElementById('date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    // Mock Flight Data Generator
    const generateMockFlights = (from, to) => {
        const airlines = [
            { name: 'SkyHigh Airlines', code: 'SH' },
            { name: 'AeroLux', code: 'AL' },
            { name: 'Nova Air', code: 'NA' },
            { name: 'Global Connect', code: 'GC' }
        ];

        const flights = [];
        const numFlights = Math.floor(Math.random() * 4) + 3; // 3 to 6 flights

        for(let i=0; i<numFlights; i++) {
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const flightNumber = `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`;
            
            // Random times
            const depHour = Math.floor(Math.random() * 18);
            const duration = Math.floor(Math.random() * 6) + 2; // 2 to 8 hours
            const arrHour = (depHour + duration) % 24;
            
            const depTime = `${depHour.toString().padStart(2, '0')}:00`;
            const arrTime = `${arrHour.toString().padStart(2, '0')}:${Math.floor(Math.random()*60).toString().padStart(2, '0')}`;
            
            // Random base price
            const price = Math.floor(Math.random() * 400) + 150;

            flights.push({
                id: i,
                airlineName: airline.name,
                flightNumber: flightNumber,
                departureTime: depTime,
                arrivalTime: arrTime,
                duration: `${duration}h ${Math.floor(Math.random()*60)}m`,
                stops: Math.random() > 0.6 ? '1 Stop' : 'Non-stop',
                basePrice: price,
                classes: [
                    { name: 'Economy', multiplier: 1 },
                    { name: 'Business', multiplier: 2.5 },
                    { name: 'First Class', multiplier: 4.2 }
                ],
                from: from.toUpperCase().substring(0,3),
                to: to.toUpperCase().substring(0,3)
            });
        }

        // Sort by price ascending
        return flights.sort((a,b) => a.basePrice - b.basePrice);
    };

    // Render Flights
    const renderFlights = (flights) => {
        flightsList.innerHTML = '';
        
        flights.forEach((flight, index) => {
            const delay = index * 0.1; // Stagger animation
            
            const card = document.createElement('div');
            card.className = 'flight-card glass-panel';
            card.style.animationDelay = `${delay}s`;
            
            card.innerHTML = `
                <div class="flight-main">
                    <div class="airline-info">
                        <span class="airline-name">${flight.airlineName}</span>
                        <span class="flight-no">${flight.flightNumber}</span>
                    </div>
                    
                    <div class="flight-route">
                        <div class="time-box">
                            <div class="time">${flight.departureTime}</div>
                            <div class="airport">${flight.from}</div>
                        </div>
                        
                        <div class="duration-line">
                            <span class="duration-text">${flight.duration}</span>
                            <div class="line">
                                <i class="ph-fill ph-airplane-in-flight"></i>
                            </div>
                            <span class="stop-info">${flight.stops}</span>
                        </div>
                        
                        <div class="time-box">
                            <div class="time">${flight.arrivalTime}</div>
                            <div class="airport">${flight.to}</div>
                        </div>
                    </div>
                </div>
                
                <div class="flight-pricing">
                    <div class="price">
                        <span>from</span> $${flight.basePrice}
                    </div>
                    <button class="btn-primary w-full select-flight-btn" data-id="${flight.id}">Select</button>
                </div>
            `;
            
            flightsList.appendChild(card);
        });

        // Add event listeners to select buttons
        document.querySelectorAll('.select-flight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const flightId = parseInt(e.target.getAttribute('data-id'));
                const flight = flights.find(f => f.id === flightId);
                openBookingModal(flight);
            });
        });
    };

    // Handle Search Submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const from = fromInput.value;
        const to = toInput.value;
        const travelers = document.getElementById('travelers-input').value;
        
        if(from && to) {
            // Hide results, show loader
            resultsSection.classList.remove('show');
            setTimeout(() => {
                resultsSection.classList.add('hidden');
                loader.classList.remove('hidden');
                
                // Simulate network request
                setTimeout(() => {
                    const flights = generateMockFlights(from, to);
                    
                    // Update meta
                    searchMeta.innerHTML = `${from} <i class="ph ph-arrow-right"></i> ${to} • ${travelers}`;
                    
                    renderFlights(flights);
                    
                    loader.classList.add('hidden');
                    resultsSection.classList.remove('hidden');
                    
                    // Small delay to allow CSS display:block to apply before animating opacity
                    setTimeout(() => {
                        resultsSection.classList.add('show');
                        
                        // Scroll to results beautifully
                        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                    
                }, 1500);
            }, 300);
        }
    });

    // Modal Logic
    const openBookingModal = (flight) => {
        selectedFlight = flight;
        basePrice = flight.basePrice;
        
        modalFlightNumber.textContent = flight.flightNumber;
        
        modalFlightSummary.innerHTML = `
            <div>
                <div style="font-weight: 600">${flight.departureTime} → ${flight.arrivalTime}</div>
                <div style="font-size: 0.9rem; color: #94A3B8">${flight.from} to ${flight.to}</div>
            </div>
            <div style="text-align: right">
                <div style="font-weight: 600">${flight.airlineName}</div>
                <div style="font-size: 0.9rem; color: #94A3B8">${flight.duration}</div>
            </div>
        `;

        // Render cabin classes
        cabinClassOptions.innerHTML = '';
        flight.classes.forEach((cabin, index) => {
            const price = Math.round(basePrice * cabin.multiplier);
            const isSelected = index === 0 ? 'selected' : '';
            
            const option = document.createElement('div');
            option.className = `class-option ${isSelected}`;
            option.innerHTML = `
                <div>
                    <span class="c-name">${cabin.name}</span>
                    <span class="c-price">$${price}</span>
                </div>
            `;
            
            option.addEventListener('click', () => {
                // Remove selected class from all
                document.querySelectorAll('.class-option').forEach(el => el.classList.remove('selected'));
                // Add to clicked
                option.classList.add('selected');
                
                updatePrice(price);
            });
            
            cabinClassOptions.appendChild(option);
        });

        // Set initial price (Economy)
        updatePrice(basePrice);
        
        bookingModal.classList.remove('hidden');
        setTimeout(() => {
            bookingModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }, 10);
    };

    const updatePrice = (price) => {
        totalPriceEl.textContent = `$${price}`;
    };

    const closeBookingModal = () => {
        bookingModal.classList.remove('active');
        setTimeout(() => {
            bookingModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            bookingForm.reset();
        }, 400); // match transition duration
    };

    closeModalBtn.addEventListener('click', closeBookingModal);

    // Close modal on click outside
    bookingModal.addEventListener('click', (e) => {
        if(e.target === bookingModal) {
            closeBookingModal();
        }
    });

    // Handle Form Submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = bookingForm.querySelectorAll('input[type="text"]')[0].value;
        const lastName = bookingForm.querySelectorAll('input[type="text"]')[1].value;
        const email = bookingForm.querySelector('input[type="email"]').value;
        const phone = bookingForm.querySelector('input[type="tel"]').value;
        const dateInput = document.getElementById('date-input').value;
        const cabinClass = document.querySelector('.class-option.selected .c-name').textContent;
        const totalPrice = document.getElementById('total-price').textContent;

        // Try saving to database
        try {
            await db.collection("bookings").add({
                firstName,
                lastName,
                email,
                phone,
                travelDate: dateInput,
                flightNumber: selectedFlight.flightNumber,
                airlineName: selectedFlight.airlineName,
                origin: selectedFlight.from,
                destination: selectedFlight.to,
                departureTime: selectedFlight.departureTime,
                arrivalTime: selectedFlight.arrivalTime,
                cabinClass,
                totalPrice,
                timestamp: new Date()
            });
            console.log("Booking successfully stored in Firebase Firestore.");
        } catch (error) {
            console.error("Error saving booking to Firestore: ", error);
        }
        
        // Show success
        closeBookingModal();
        
        successToast.classList.remove('hidden');
        setTimeout(() => {
            successToast.classList.add('show');
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                successToast.classList.remove('show');
                setTimeout(() => {
                    successToast.classList.add('hidden');
                }, 400);
            }, 4000);
        }, 500);
    });
});
