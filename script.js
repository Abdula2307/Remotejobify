// =========================
// ELEMENTS
// =========================

const jobFinder =
    document.getElementById("jobFinder");

const jobPoster =
    document.getElementById("jobPoster");

const modalOverlay =
    document.getElementById("modalOverlay");

const closeModal =
    document.getElementById("closeModal");

const modalIcon =
    document.getElementById("modalIcon");

const modalTitle =
    document.getElementById("modalTitle");

const modalText =
    document.getElementById("modalText");

const continueButton =
    document.getElementById("continueButton");


// =========================
// STATE
// =========================

let selectedOption = "";


// =========================
// OPEN MODAL
// =========================

function openModal(type) {

    selectedOption = type;

    modalOverlay.classList.add("active");


    // =========================
    // JOB FINDER
    // =========================

    if (type === "finder") {

        modalTitle.textContent =
            "Job Finder";

        modalText.textContent =
            "Find available jobs and discover " +
            "opportunities that match your skills.";

        continueButton.textContent =
            "Continue";

        modalIcon.innerHTML =
            '<span class="modal-search-icon"></span>';

        continueButton.onclick =
            function () {

                window.location.href =
                    "job-finder.html";

            };

    }


    // =========================
    // JOB POSTER
    // =========================

    if (type === "poster") {

        modalTitle.textContent =
            "Job Poster";

        modalText.textContent =
            "Create an employer account or login " +
            "to post your vacancy.";

        continueButton.textContent =
            "Continue";

        modalIcon.innerHTML =
            '<span class="modal-poster-icon"></span>';

        continueButton.onclick =
            function () {

                window.location.href =
                    "poster-auth.html";

            };

    }

}


// =========================
// JOB FINDER
// =========================

jobFinder.addEventListener(
    "click",
    function () {

        openModal("finder");

    }
);


// =========================
// JOB POSTER
// =========================

jobPoster.addEventListener(
    "click",
    function () {

        openModal("poster");

    }
);


// =========================
// CLOSE MODAL
// =========================

function closeTheModal() {

    modalOverlay.classList.remove(
        "active"
    );

}


closeModal.addEventListener(
    "click",
    closeTheModal
);


// =========================
// CLICK OUTSIDE
// =========================

modalOverlay.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            modalOverlay
        ) {

            closeTheModal();

        }

    }
);


// =========================
// ESC KEY
// =========================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeTheModal();

        }

    }
);


// =========================
// INTERNSHIPS + SCHOLARSHIPS CARDS
// =========================
(function () {

    function go(id, page) {

        var card =
            document.getElementById(id);

        if (!card) {
            return;
        }

        card.addEventListener(
            "click",
            function () {
                window.location.href = page;
            }
        );

        card.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    window.location.href = page;
                }
            }
        );

    }

    go("internshipsCard", "internships.html");
    go("scholarshipsCard", "scholarships.html");

})();
