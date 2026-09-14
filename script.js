/* ============================================================
   SASTIMASTI
   ============================================================ */


/* ============================================================
   SUPABASE
   ============================================================ */

const SUPABASE_URL =
    "https://swkmyytlojkhcysmztlx.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_Hq3u9UL3kNY7XUnMMKG24g_4mydA99v";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );



/* ============================================================
   HELPERS
   ============================================================ */


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}



/* ============================================================
   TIME CONVERSION
   ============================================================ */


function convertTo24Hour(timeString) {

    if (!timeString) {
        return "00:00:00";
    }


    const time =
        timeString
            .trim()
            .toUpperCase();


    const match =
        time.match(
            /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
        );


    if (!match) {

        return "00:00:00";

    }


    let hour =
        Number(match[1]);


    const minute =
        Number(match[2]);


    const period =
        match[3];


    if (
        period === "PM" &&
        hour !== 12
    ) {

        hour += 12;

    }


    if (
        period === "AM" &&
        hour === 12
    ) {

        hour = 0;

    }


    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

}



/* ============================================================
   FOOTER
   ============================================================ */


function setupFooter() {

    const helpLink =
        document.getElementById(
            "helpFeedback"
        );


    if (helpLink) {

        helpLink.href =
            "help.html";

    }

}



/* ============================================================
   HOME — LOAD RIDES
   ============================================================ */


async function loadRides() {

    const ridesList =
        document.getElementById(
            "ridesList"
        );


    if (!ridesList) {
        return;
    }


    ridesList.innerHTML =
        `<div class="loading-message">
            Loading rides...
        </div>`;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("rides")
            .select("*");


    if (error) {

        console.error(error);


        ridesList.innerHTML =
            `<div class="empty-state">

                <h3>
                    Couldn't load rides
                </h3>

                <p>
                    Something went wrong. Please try again.
                </p>

                <button
                    class="btn btn-primary"
                    onclick="loadRides()"
                >
                    Try again →
                </button>

            </div>`;

        return;

    }


    const now =
        new Date();


    const upcomingRides =
        (data || [])
            .filter(ride => {

                if (
                    ride.status !==
                    "active"
                ) {

                    return false;

                }


                const rideDateTime =
                    new Date(
                        `${ride.ride_date}T${convertTo24Hour(
                            ride.ride_time
                        )}`
                    );


                return (
                    !isNaN(
                        rideDateTime.getTime()
                    ) &&
                    rideDateTime >= now
                );

            })
            .sort((a, b) => {

                const dateA =
                    new Date(
                        `${a.ride_date}T${convertTo24Hour(
                            a.ride_time
                        )}`
                    );


                const dateB =
                    new Date(
                        `${b.ride_date}T${convertTo24Hour(
                            b.ride_time
                        )}`
                    );


                return dateA - dateB;

            });


    if (
        upcomingRides.length ===
        0
    ) {

        ridesList.innerHTML =
            `<div class="empty-state">

                <h3>
                    No upcoming rides.
                </h3>

                <p>
                    Be the first one to post a ride.
                </p>

                <a
                    href="offer.html"
                    class="btn btn-primary"
                >
                    Offer a Ride →
                </a>

            </div>`;

        return;

    }


    ridesList.innerHTML =
        upcomingRides
            .map(
                ride =>
                    createRideCard(ride)
            )
            .join("");


    setupWhatsAppButtons();

}



/* ============================================================
   RIDE CARD
   ============================================================ */


function createRideCard(ride) {

    const mode =
        ride.travel_mode ===
        "self-drive"
            ? "🚗 Self-drive"
            : ride.travel_mode ===
              "auto"
                ? "🛺 Auto"
                : "🚕 Cab";


    const cost =
        ride.cost_per_person !== null &&
        ride.cost_per_person !== undefined &&
        ride.cost_per_person !== ""
            ? `₹${ride.cost_per_person}/person`
            : "Cost not specified";


    return `

        <article class="ride-card">


            <div class="ride-route">

                <div>

                    <span class="ride-location-label">
                        FROM
                    </span>

                    <strong>
                        ${escapeHtml(
                            ride.from_location
                        )}
                    </strong>

                </div>


                <div class="route-arrow">
                    →
                </div>


                <div>

                    <span class="ride-location-label">
                        TO
                    </span>

                    <strong>
                        ${escapeHtml(
                            ride.to_location
                        )}
                    </strong>

                </div>

            </div>



            <div class="ride-details">

                <span>
                    📅 ${formatDate(
                        ride.ride_date
                    )}
                </span>


                <span>
                    🕐 ${escapeHtml(
                        ride.ride_time
                    )}
                </span>


                <span>
                    👥 ${escapeHtml(
                        ride.available_seats
                    )} seats
                </span>


                <span>
                    ${mode}
                </span>

            </div>



            <div class="ride-bottom">


                <div class="ride-poster">

                    <strong class="ride-price">
                        ${cost}
                    </strong>


                    <span class="posted-by">
                        Posted by
                        <strong>
                            ${escapeHtml(
                                ride.organizer_name
                            )}
                        </strong>
                    </span>

                </div>



                <button
                    type="button"
                    class="whatsapp-btn"
                    data-ride-id="${escapeHtml(
                        ride.id
                    )}"
                    data-from="${escapeHtml(
                        ride.from_location
                    )}"
                    data-to="${escapeHtml(
                        ride.to_location
                    )}"
                    data-date="${escapeHtml(
                        formatDate(
                            ride.ride_date
                        )
                    )}"
                >
                    WhatsApp →
                </button>


            </div>


        </article>

    `;

}



/* ============================================================
   WHATSAPP
   ============================================================ */


function setupWhatsAppButtons() {

    const buttons =
        document.querySelectorAll(
            ".whatsapp-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const rideId =
                    button.dataset.rideId;


                const from =
                    button.dataset.from;


                const to =
                    button.dataset.to;


                const rideDate =
                    button.dataset.date;


                const message =
                    `Hey! I saw your Carpool ride from ${from} to ${to} on ${rideDate} and I'm interested. Is a seat still available?`;


                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .rpc(
                            "get_whatsapp_link",
                            {
                                p_ride_id:
                                    rideId
                            }
                        );


                if (error) {

                    console.error(error);


                    alert(
                        "Couldn't open WhatsApp. Please try again."
                    );


                    return;

                }


                if (data) {

                    const whatsappUrl =
                        `${data}${data.includes("?") ? "&" : "?"}text=${encodeURIComponent(
                            message
                        )}`;


                    window.open(
                        whatsappUrl,
                        "_blank"
                    );

                }

            }
        );

    });

}



/* ============================================================
   LOCATION SUGGESTIONS
   ============================================================ */

function setupLocationSuggestions() {

    const fields =
        document.querySelectorAll(
            ".location-field"
        );


    fields.forEach(field => {

        const input =
            field.querySelector(
                "input"
            );


        const suggestions =
            field.querySelector(
                ".location-suggestions"
            );


        if (
            !input ||
            !suggestions
        ) {

            return;

        }


        /* SHOW DROPDOWN */

        input.addEventListener(
            "focus",
            () => {

                suggestions.style.display =
                    "block";

            }
        );


        input.addEventListener(
            "click",
            () => {

                suggestions.style.display =
                    "block";

            }
        );


        input.addEventListener(
            "input",
            () => {

                suggestions.style.display =
                    "block";

            }
        );


        /* SELECT LOCATION */

        const options =
            suggestions.querySelectorAll(
                ".location-option"
            );


        options.forEach(option => {

            option.addEventListener(
                "mousedown",
                event => {

                    /*
                     Prevent the input from
                     losing focus before the
                     selection is completed.
                    */

                    event.preventDefault();


                    input.value =
                        option.dataset.location;


                    suggestions.style.display =
                        "none";

                }
            );

        });


        /* CLOSE WHEN CLICKING OUTSIDE */

        document.addEventListener(
            "click",
            event => {

                if (
                    !field.contains(
                        event.target
                    )
                ) {

                    suggestions.style.display =
                        "none";

                }

            }
        );

    });

}



/* ============================================================
   OFFER RIDE
   ============================================================ */


function setupRideForm() {

    const form =
        document.getElementById(
            "rideForm"
        );


    if (!form) {
        return;
    }


    /*
     IMPORTANT:
     Location suggestions are initialized
     here, once, on the Offer a Ride page.
    */

    setupLocationSuggestions();


    const dateInput =
        document.getElementById(
            "date"
        );


    if (dateInput) {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        dateInput.min =
            today;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "name"
                    )
                    .value
                    .trim();


            const from =
                document
                    .getElementById(
                        "from"
                    )
                    .value
                    .trim();


            const to =
                document
                    .getElementById(
                        "to"
                    )
                    .value
                    .trim();


            const travelMode =
                document
                    .getElementById(
                        "travelMode"
                    )
                    .value;


            const date =
                document
                    .getElementById(
                        "date"
                    )
                    .value;


            const time =
                document
                    .getElementById(
                        "time"
                    )
                    .value
                    .trim();


            const seats =
                Number(
                    document
                        .getElementById(
                            "seats"
                        )
                        .value
                );


            const costValue =
                document
                    .getElementById(
                        "cost"
                    )
                    .value;


            const cost =
                costValue === ""
                    ? null
                    : Number(
                        costValue
                    );


            const whatsapp =
                document
                    .getElementById(
                        "whatsapp"
                    )
                    .value
                    .trim();


            if (
                whatsapp.length !== 10 ||
                !/^\d{10}$/.test(
                    whatsapp
                )
            ) {

                alert(
                    "Please enter a valid 10-digit WhatsApp number."
                );


                return;

            }


            const submitButton =
                form.querySelector(
                    "button[type='submit']"
                );


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Posting...";


            const {
    data,
    error
} =
    await supabaseClient
        .rpc(
            "create_ride",
            {
                
                p_organizer_name: name,

                p_from_location: from,

                p_to_location: to,

                p_travel_mode: travelMode,

                p_ride_date: date,

                p_ride_time: time,

                p_available_seats: seats,

                p_cost_per_person: cost,

                p_whatsapp: whatsapp
            
            }
        );


            if (error) {

                console.error(error);


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "Post Ride →";


                alert(
                    "Couldn't post the ride. Please try again."
                );


                return;

            }


            showSuccessModal(
    data.ride_code
);

        }
    );

}



/* ============================================================
   SUCCESS MODAL
   ============================================================ */


function showSuccessModal(
    rideCode
) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "success-overlay";


    overlay.innerHTML = `

        <div class="success-modal">


            <div class="success-icon">
                ✓
            </div>


            <h2>
                Ride Posted!
            </h2>


            <p>
                You're officially going somewhere.
            </p>



            <div class="ride-code-card">

                <span class="ride-code-label">
                    Your Ride Code
                </span>


                <div class="ride-code">
                    ${escapeHtml(
                        rideCode
                    )}
                </div>

            </div>



            <p class="screenshot-note">
                📸 Screenshot this. You'll need your Ride Code to manage your ride later.
            </p>



            <button
                type="button"
                class="btn btn-primary"
                id="copyRideCode"
            >
                Copy Ride Code
            </button>


            <button
                type="button"
                class="done-btn"
                id="doneRidePost"
            >
                Done
            </button>


        </div>

    `;


    document.body.appendChild(
        overlay
    );


    document
        .getElementById(
            "copyRideCode"
        )
        .addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        String(
                            rideCode
                        )
                    );


                    const button =
                        document.getElementById(
                            "copyRideCode"
                        );


                    button.textContent =
                        "Copied ✓";


                } catch (error) {

                    console.error(
                        error
                    );

                }

            }
        );


    document
        .getElementById(
            "doneRidePost"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

}



/* ============================================================
   MANAGE RIDE
   ============================================================ */


function setupManageRide() {

    const searchForm =
        document.getElementById(
            "manageSearchForm"
        );


    const managePanel =
        document.getElementById(
            "managePanel"
        );


    if (
        !searchForm ||
        !managePanel
    ) {

        return;

    }


    const message =
        document.getElementById(
            "manageMessage"
        );


    searchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const code =
                document
                    .getElementById(
                        "rideCode"
                    )
                    .value
                    .trim();


            if (
                !/^\d{4}$/.test(
                    code
                )
            ) {

                message.textContent =
                    "Please enter a valid 4-digit Ride Code.";


                return;

            }


            message.textContent =
                "Finding your ride...";


            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "get_ride_by_code",
                        {
                            p_ride_code:
                                Number(
                                    code
                                )
                        }
                    );


            if (
                error ||
                !data ||
                data.length === 0
            ) {

                message.textContent =
                    "Ride not found. Check your Ride Code.";


                return;

            }


            const ride =
                Array.isArray(data)
                    ? data[0]
                    : data;


            populateManageForm(
                ride
            );


            managePanel.style.display =
                "block";


            message.textContent =
                "";

        }
    );


    const manageForm =
        document.getElementById(
            "manageRideForm"
        );


    if (manageForm) {

        manageForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const code =
            document
                .getElementById(
                    "rideCode"
                )
                .value
                .trim();


        message.textContent =
            "Saving...";


        const {
            error
        } =
            await supabaseClient
                .rpc(
                    "update_ride_by_code",
                    {
                        p_ride_code:
                            Number(code),

                        p_from_location:
                            document
                                .getElementById(
                                    "manageFrom"
                                )
                                .value
                                .trim(),

                        p_to_location:
                            document
                                .getElementById(
                                    "manageTo"
                                )
                                .value
                                .trim(),

                        p_travel_mode:
                            document
                                .getElementById(
                                    "manageMode"
                                )
                                .value,

                        p_ride_date:
                            document
                                .getElementById(
                                    "manageDate"
                                )
                                .value,

                        p_ride_time:
                            document
                                .getElementById(
                                    "manageTime"
                                )
                                .value
                                .trim(),

                        p_available_seats:
                            Number(
                                document
                                    .getElementById(
                                        "manageSeats"
                                    )
                                    .value
                            ),

                        p_cost_per_person:
                            document
                                .getElementById(
                                    "manageCost"
                                )
                                .value === ""
                                ? null
                                : Number(
                                    document
                                        .getElementById(
                                            "manageCost"
                                        )
                                        .value
                                )
                    }
                );


        if (error) {

            console.error(
                error
            );


            message.textContent =
                "Couldn't save changes. Please try again.";


            return;

        }


        message.textContent =
            "Changes saved ✓";

    }
);

    }


    const cancelButton =
        document.getElementById(
            "cancelRideBtn"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            async () => {

                const code =
                    document
                        .getElementById(
                            "rideCode"
                        )
                        .value
                        .trim();


                const confirmed =
                    confirm(
                        "Are you sure you want to cancel this ride?"
                    );


                if (!confirmed) {
                    return;
                }


                const {
                    error
                } =
                    await supabaseClient
                        .rpc(
                            "cancel_ride_by_code",
                            {
                                p_ride_code:
                                    Number(
                                        code
                                    )
                            }
                        );


                if (error) {

                    console.error(
                        error
                    );


                    message.textContent =
                        "Couldn't cancel the ride. Please try again.";


                    return;

                }


                alert(
                    "Ride cancelled."
                );


                window.location.href =
                    "index.html";

            }
        );

    }

}



/* ============================================================
   POPULATE MANAGE FORM
   ============================================================ */


function populateManageForm(
    ride
) {

    document
        .getElementById(
            "displayRideCode"
        )
        .textContent =
            ride.ride_code;


    document
        .getElementById(
            "manageFrom"
        )
        .value =
            ride.from_location;


    document
        .getElementById(
            "manageTo"
        )
        .value =
            ride.to_location;


    document
        .getElementById(
            "manageMode"
        )
        .value =
            ride.travel_mode;


    document
        .getElementById(
            "manageDate"
        )
        .value =
            ride.ride_date;


    document
        .getElementById(
            "manageTime"
        )
        .value =
            ride.ride_time;


    /*
     Your database column is
     available_seats.
    */

    document
        .getElementById(
            "manageSeats"
        )
        .value =
            ride.available_seats;


    document
        .getElementById(
            "manageCost"
        )
        .value =
            ride.cost_per_person ?? "";

}



/* ============================================================
   HELP & FEEDBACK
   ============================================================ */


function setupFeedback() {

    const form =
        document.getElementById(
            "feedbackForm"
        );


    if (!form) {
        return;
    }


    let selectedCategory =
        "";


    const options =
        document.querySelectorAll(
            ".feedback-option"
        );


    const textarea =
        document.getElementById(
            "feedbackMessage"
        );


    const characterCount =
        document.getElementById(
            "characterCount"
        );


    const status =
        document.getElementById(
            "feedbackMessageStatus"
        );


    options.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                options.forEach(
                    item => {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                option.classList.add(
                    "selected"
                );


                selectedCategory =
                    option.dataset.category;

            }
        );

    });


    if (
        textarea &&
        characterCount
    ) {

        textarea.addEventListener(
            "input",
            () => {

                characterCount.textContent =
                    textarea.value.length;

            }
        );

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const text =
                textarea.value.trim();


            if (!selectedCategory) {

                status.textContent =
                    "Pick an option first.";


                return;

            }


            if (!text) {

                status.textContent =
                    "Tell us a little more.";


                textarea.focus();


                return;

            }


            const submitButton =
                form.querySelector(
                    "button[type='submit']"
                );


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Sending...";


            status.textContent =
                "";


            const {
                error
            } =
                await supabaseClient
                    .rpc(
                        "submit_feedback",
                        {
                            p_category:
                                selectedCategory,

                            p_message:
                                text
                        }
                    );


            if (error) {

                console.error(
                    error
                );


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "Send →";


                status.textContent =
                    "Couldn't send that. Please try again.";


                return;

            }


            form.innerHTML = `

                <div class="feedback-success">

                    <div class="success-icon">
                        ✓
                    </div>


                    <h2>
                        Thanks for telling us.
                    </h2>


                    <p>
                        We'll take a look.
                    </p>

                </div>

            `;

        }
    );

}



/* ============================================================
   INITIALIZE
   ============================================================ */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupFooter();

        loadRides();

        setupRideForm();

        setupManageRide();

        setupFeedback();

    }
);