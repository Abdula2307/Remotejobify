/* =========================================================
   TEMPORARY JOB DATA WILL BE HERE
   =========================================================
   
   Later:
   This data will come from an API / database

   For now we are keeping everything on the frontend
========================================================= */

const jobs = [];

/* =========================================================
   TEMPORARY POSTED JOBS WILL BE HERE FOR NOW
   =========================================================

   API / DATABASE WILL BE CONNECTED HERE

   FOR NOW:
   we can read job posters posted jobs from localstorage and it will be saved there also 
========================================================= */



/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(category) {

    const categoryNames = {

        technology:
            "Technology",

        design:
            "Design",

        marketing:
            "Marketing",

        education:
            "Education"

    };

    return (
        categoryNames[category] ||
        "Job Opportunity"
    );

}


/* =========================================================
   COMBINE DEMO + POSTED JOBS
========================================================= */




/* =========================================================
   API PLACEHOLDER
========================================================= */

/*
    FOR FUTURE API USE THIS:

    const response =
        await fetch("/api/jobs");

    const apiJobs =
        await response.json();

    jobs.push(...apiJobs);

*/

/* =========================================================
   SAVE POSTED JOB
========================================================= */




/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(category) {

    const names = {

        technology:
            "Technology",

        design:
            "Design",

        marketing:
            "Marketing",

        education:
            "Education"

    };

    return (
        names[category] ||
        "Job Opportunity"
    );

}

/* =========================================================
   ELEMENTS
========================================================= */

const jobsList =
    document.getElementById("jobsList");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const filterButtons =
    document.querySelectorAll(".filter-button");

const jobCount =
    document.getElementById("jobCount");

const noResults =
    document.getElementById("noResults");

const resetSearch =
    document.getElementById("resetSearch");

const sortButton =
    document.getElementById("sortButton");


/* Modal */

const jobModal =
    document.getElementById("jobModal");

const modalClose =
    document.getElementById("modalClose");

const modalJobTitle =
    document.getElementById("modalJobTitle");

const modalCompany =
    document.getElementById("modalCompany");

const modalLocation =
    document.getElementById("modalLocation");

const modalVacancies =
    document.getElementById("modalVacancies");

const modalDescription =
    document.getElementById("modalDescription");

const modalCategory =
    document.querySelector(".modal-category");

const modalApply =
    document.getElementById("modalApply");


/* Toast */

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   STATE
========================================================= */

let selectedCategory = "all";

let currentJobs = [...jobs];

let currentJob = null;

let newestFirst = true;

let toastTimer;


/* =========================================================
   RENDER JOBS
========================================================= */

function renderJobs(jobArray) {

    jobsList.innerHTML = "";

    jobCount.textContent =
        `${jobArray.length} ${
            jobArray.length === 1
                ? "opportunity"
                : "opportunities"
        } available`;


    if (jobArray.length === 0) {

        noResults.classList.add("visible");

        return;
    }


    noResults.classList.remove("visible");


    jobArray.forEach(
        function (job, index) {

            const card =
                createJobCard(job, index);

            jobsList.appendChild(card);

        }
    );
}


/* =========================================================
   CREATE JOB CARD
========================================================= */

function createJobCard(job, index) {

    const card =
        document.createElement("article");

    card.className = "job-card";

    card.style.animationDelay =
        `${index * 0.06}s`;

    const isJobPoster =
        JoblyAPI.isPoster();

    let actionButtons = "";

    if (isJobPoster) {

        actionButtons = `
            <button
                class="view-job-button"
                type="button"
            >
                View
            </button>
        `;

    } else {

        actionButtons = `
            <div class="job-action-buttons">

                <button
                    class="view-job-button"
                    type="button"
                >
                    View
                </button>

                

            </div>
        `;

    }


    card.innerHTML = `

        <div class="job-card-top">

            <div class="job-card-info">

                <span class="job-category">
                    ${escapeHTML(job.categoryName)}
                </span>

                <h3 class="job-title">
                    ${escapeHTML(job.title)}
                </h3>

                <p class="company-name">
                    ${escapeHTML(job.company)}
                </p>

                <p class="job-description">
                    ${escapeHTML(job.description)}
                </p>

                <div class="job-meta">

                    <span class="job-meta-item">

                        <span class="location-small-icon"></span>

                        ${escapeHTML(job.location)}

                    </span>

                    <span class="job-meta-item">

                        <span class="vacancy-small-icon"></span>

                        ${job.vacancies}

                        ${
                            job.vacancies === 1
                                ? "Vacancy"
                                : "Vacancies"
                        }

                    </span>

                </div>

            </div>

            <div class="job-card-action">

                ${actionButtons}

            </div>

        </div>
    `;


    /* =========================
       VIEW BUTTON
    ========================= */

    const viewButton =
        card.querySelector(
            ".view-job-button"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                openJobModal(job);

            }
        );

    }


    /* =========================
       APPLY BUTTON
    ========================= */

    const applyButton =
        card.querySelector(
            ".apply-job-button"
        );


    if (applyButton) {

        applyButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                openApplyPage(job);

            }
        );

    }


    /* =========================
       CARD CLICK
    ========================= */

    card.addEventListener(
        "click",
        function () {

            openJobModal(job);

        }
    );


    return card;
}


/* =========================================================
   OPEN APPLY PAGE
========================================================= */

function openApplyPage(job) {

    if (!job || !job.id) {

        showToast(
            "Unable to open this job."
        );

        return;

    }


    /*
        Save selected job temporarily
        Apply page will read this ID
    */

    sessionStorage.setItem(
        "joblySelectedJobId",
        String(job.id)
    );


    window.location.href =
        "apply-job.html";

}

/* =========================================================
   FILTER JOBS
========================================================= */

function filterJobs() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    let filtered =
        jobs.filter(
            function (job) {

                const matchesCategory =
                    selectedCategory === "all" ||
                    job.category === selectedCategory;


                const searchableText =
                    `
                    ${job.title}
                    ${job.company}
                    ${job.location}
                    ${job.description}
                    ${job.categoryName}
                    `.toLowerCase();


                const matchesSearch =
                    searchableText.includes(
                        searchTerm
                    );


                return (
                    matchesCategory &&
                    matchesSearch
                );

            }
        );


    if (newestFirst) {

        filtered.sort(
            function (a, b) {

                return (
                    a.postedDaysAgo -
                    b.postedDaysAgo
                );

            }
        );

    } else {

        filtered.sort(
            function (a, b) {

                return (
                    b.postedDaysAgo -
                    a.postedDaysAgo
                );

            }
        );
    }


    currentJobs = filtered;

    renderJobs(currentJobs);
}


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    function () {

        if (
            searchInput.value.length > 0
        ) {

            clearSearch.classList.add(
                "visible"
            );

        } else {

            clearSearch.classList.remove(
                "visible"
            );

        }


        filterJobs();

    }
);


/* =========================================================
   CLEAR SEARCH
========================================================= */

clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        clearSearch.classList.remove(
            "visible"
        );

        searchInput.focus();

        filterJobs();

    }
);


/* =========================================================
   CATEGORY FILTERS
========================================================= */

filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedCategory =
                    button.dataset.category;


                filterJobs();

            }
        );

    }
);


/* =========================================================
   RESET SEARCH
========================================================= */

resetSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        selectedCategory = "all";


        filterButtons.forEach(
            function (button) {

                button.classList.remove(
                    "active"
                );

            }
        );


        const allButton =
            document.querySelector(
                '[data-category="all"]'
            );


        if (allButton) {

            allButton.classList.add(
                "active"
            );

        }


        clearSearch.classList.remove(
            "visible"
        );


        filterJobs();

    }
);


/* =========================================================
   SORT
========================================================= */

sortButton.addEventListener(
    "click",
    function () {

        newestFirst =
            !newestFirst;


        sortButton.innerHTML =
            newestFirst
                ? `
                    <span class="sort-icon"></span>
                    Newest
                  `
                : `
                    <span class="sort-icon"></span>
                    Oldest
                  `;


        filterJobs();

    }
);


/* =========================================================
   OPEN JOB MODAL
========================================================= */

function openJobModal(job) {

    currentJob = job;


    modalJobTitle.textContent =
        job.title;


    modalCompany.textContent =
        job.company;


    modalLocation.textContent =
        job.location;


    modalVacancies.textContent =
        `${job.vacancies} ${
            job.vacancies === 1
                ? "Vacancy"
                : "Vacancies"
        }`;


    modalDescription.textContent =
        job.description;


    modalCategory.textContent =
        job.categoryName;


    updateApplyButton(job);


    jobModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   UPDATE APPLY BUTTON
========================================================= */
function updateApplyButton(job) {

    if (JoblyAPI.isPoster()) {

        modalApply.style.display =
            "none";

        const note =
            document.getElementById(
                "modalApplyNote"
            );

        if (note) {

            note.textContent =
                "Job details";

        }

        return;

    }

    modalApply.style.display =
        "inline-flex";


    modalApply.innerHTML =
        `
            Apply Now
            <span>→</span>
        `;

}


/* =========================================================
   CLOSE JOB MODAL
========================================================= */

function closeJobModal() {

    jobModal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";
}


modalClose.addEventListener(
    "click",
    closeJobModal
);


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

jobModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === jobModal
        ) {

            closeJobModal();

        }

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            jobModal.classList.contains(
                "active"
            )
        ) {

            closeJobModal();

        }

    }
);


/* =========================================================
   APPLY NOW FROM MODAL
========================================================= */

modalApply.addEventListener(
    "click",
    function () {

        if (!currentJob) {

            return;

        }

        openApplyPage(currentJob);

    }
);


/* =========================================================
   OPEN APPLICATION URL
========================================================= */

function openApplicationURL(url) {

    try {

        const validURL =
            new URL(url);


        if (
            validURL.protocol !==
                "http:" &&
            validURL.protocol !==
                "https:"
        ) {

            showToast(
                "Invalid application link."
            );

            return;

        }


        window.open(
            validURL.href,
            "_blank",
            "noopener,noreferrer"
        );


    } catch (error) {

        showToast(
            "The application link is invalid."
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function loadJobs() {
    jobCount.textContent = "Loading jobs...";
    try {
        const apiJobs = await JoblyAPI.request("/jobs");
        jobs.length = 0;
        jobs.push(...apiJobs);
        filterJobs();
    } catch (error) {
        jobs.length = 0;
        renderJobs(jobs);
        showToast(error.message);
    }
}

loadJobs();

/* =====================================================
   JOB POSTER ACCESS
===================================================== */

const postJobButton =
    document.getElementById("postJobButton");


/*
    TEMPORARY FRONTEND LOGIN STATE

    true  = Job Poster
    false = Normal Job Finder

    Later API/backend authentication
    will replace this
*/

const isJobPoster =
    JoblyAPI.isPoster();


/* =====================================================
   SHOW POST JOB BUTTON
===================================================== */

if (postJobButton) {

    if (isJobPoster) {

        postJobButton.style.display = "inline-flex";

    } else {

        postJobButton.style.display = "none";

    }

}


/* =====================================================
   POST JOB
===================================================== */

if (postJobButton) {

    postJobButton.addEventListener("click", function () {

        /*
            TEMPORARY PAGE

            Later this page will contain the
            complete Job Posting form

            API will be connected here:

            // fetch("/api/jobs", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify(jobData)
            // });
        */

        window.location.href = "post-job.html";

    });

}


document.addEventListener("DOMContentLoaded", function () {

    const role =
        JoblyAPI.isPoster() ? "poster" : "finder";

    const postJobButton =
        document.getElementById("postJobButton");


    if (!postJobButton) {
        return;
    }


    if (role === "poster") {

        postJobButton.style.display =
            "inline-flex";

    } else {

        postJobButton.style.display =
            "none";

    }


    postJobButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "post-job.html";

        }
    );

});

/* =====================================================
   PROFILE SYSTEM
===================================================== */

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileDropdown =
    document.getElementById(
        "profileDropdown"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileRole =
    document.getElementById(
        "profileRole"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* =====================================================
   LOAD PROFILE
===================================================== */

function loadProfile() {

    const isPoster =
        JoblyAPI.isPoster();

    const account =
        isPoster
            ? JoblyAPI.getUser()
            : null;

    profileRole.textContent =
        isPoster
            ? "Job Poster"
            : "Job Finder";


    /* =========================
       DEFAULT
    ========================= */

    if (!account) {

        profileName.textContent =
            "Guest";

        profileEmail.textContent =
            "Browsing jobs";

        profileAvatar.textContent =
            "G";

        return;

    }


    /* =========================
       DISPLAY
    ========================= */

    profileName.textContent =
        account.name || "User";

    profileEmail.textContent =
        account.email || "No email";


    const name =
        account.name ||
        account.email ||
        "User";


    profileAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


/* =====================================================
   OPEN / CLOSE PROFILE
===================================================== */

if (profileButton) {

    profileButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            profileDropdown.classList.toggle(
                "show"
            );

        }
    );

}


/* =====================================================
   CLICK OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            profileDropdown &&
            !profileDropdown.contains(
                event.target
            ) &&
            !profileButton.contains(
                event.target
            )
        ) {

            profileDropdown.classList.remove(
                "show"
            );

        }

    }
);


/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            JoblyAPI.logout();


            window.location.href =
                "index.html";

        }
    );

}


/* =====================================================
   START
===================================================== */

loadProfile();