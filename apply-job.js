/* =========================================================
   ELEMENTS
========================================================= */

const jobCategory =
    document.getElementById(
        "jobCategory"
    );

const jobTitle =
    document.getElementById(
        "jobTitle"
    );

const jobCompany =
    document.getElementById(
        "jobCompany"
    );

const jobLocation =
    document.getElementById(
        "jobLocation"
    );

const jobVacancies =
    document.getElementById(
        "jobVacancies"
    );

const jobDescription =
    document.getElementById(
        "jobDescription"
    );

const applicationText =
    document.getElementById(
        "applicationText"
    );

const applicationNote =
    document.getElementById(
        "applicationNote"
    );

const applyButton =
    document.getElementById(
        "applyButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================================
   GET SELECTED JOB
========================================================= */

async function getSelectedJob() {

    const selectedJobId =
        sessionStorage.getItem(
            "joblySelectedJobId"
        );

    if (!selectedJobId) {
        return null;
    }

    try {
        return await JoblyAPI.request(
            "/jobs/" +
            encodeURIComponent(selectedJobId)
        );
    } catch (error) {
        return null;
    }

}


/* =========================================================
   WHATSAPP NUMBER FORMAT
========================================================= */

function createWhatsAppURL(number, job) {

    if (!number) {

        return null;

    }


    let cleanNumber =
        String(number)
            .trim()
            .replace(
                /[\s\-().]/g,
                ""
            );

    cleanNumber =
        cleanNumber.replace(
            /^\+/,
            ""
        );

    if (
        cleanNumber.startsWith("0")
    ) {

        cleanNumber =
            "92" +
            cleanNumber.substring(1);

    }

    if (
        !/^\d{10,15}$/.test(
            cleanNumber
        )
    ) {

        return null;

    }


    const message =
        `Hello, I am interested in the ${job.title} position at ${job.company}. I would like to apply for this job.`;


    return (
        "https://wa.me/" +
        cleanNumber +
        "?text=" +
        encodeURIComponent(
            message
        )
    );

}


/* =========================================================
   WEBSITE URL
========================================================= */

function openWebsite(url) {

    try {

        const validURL =
            new URL(url);


        if (
            validURL.protocol !== "http:" &&
            validURL.protocol !== "https:"
        ) {

            return false;

        }


        window.open(
            validURL.href,
            "_blank",
            "noopener,noreferrer"
        );


        return true;

    } catch (error) {

        return false;

    }

}


/* =========================================================
   LOAD JOB
========================================================= */

async function loadJob() {

    const job =
        await getSelectedJob();


    if (!job) {

        jobTitle.textContent =
            "Job not found";

        jobCompany.textContent =
            "This job is no longer available.";

        applyButton.style.display =
            "none";

        applicationText.textContent =
            "The selected job could not be found.";

        applicationNote.textContent =
            "";

        return;

    }


    /* =========================
       BASIC INFORMATION
    ========================= */

    jobCategory.textContent =
        getCategoryName(
            job.category
        );


    jobTitle.textContent =
        job.title ||
        "Job Opportunity";


    jobCompany.textContent =
        job.company ||
        "Company";


    jobLocation.textContent =
        job.location ||
        "Location";


    const vacancies =
        Number(
            job.vacancies
        ) || 1;


    jobVacancies.textContent =
        `${vacancies} ${
            vacancies === 1
                ? "Vacancy"
                : "Vacancies"
        }`;


    jobDescription.textContent =
        job.description ||
        "No job description available.";


    /* =========================
       APPLICATION
    ========================= */

    const method =
        job.applyMethod ||
        (
            job.application &&
            job.application.type
        ) ||
        "whatsapp";


    const value =
        job.applyValue ||
        (
            job.application &&
            job.application.url
        ) ||
        "";


    /* =========================
       WHATSAPP
    ========================= */

    if (
        method === "whatsapp"
    ) {

        applyButton.style.display =
            "inline-flex";


        applyButton.textContent =
            "Apply on WhatsApp";


        applicationText.textContent =
            "Contact the job poster directly on WhatsApp to apply for this position.";


        applicationNote.textContent =
            "Clicking the button will open WhatsApp with a ready-to-send application message.";


        applyButton.onclick =
            function () {

                const whatsappURL =
                    createWhatsAppURL(
                        value,
                        job
                    );


                if (!whatsappURL) {

                    alert(
                        "The job poster's WhatsApp number is invalid or unavailable."
                    );

                    return;

                }


                window.open(
                    whatsappURL,
                    "_blank"
                );

            };


        return;

    }


    /* =========================
       WEBSITE
    ========================= */

    if (
        method === "website"
    ) {

        applyButton.style.display =
            "inline-flex";


        applyButton.textContent =
            "Apply Now →";


        applicationText.textContent =
            "Continue to the application website provided by the job poster.";


        applicationNote.textContent =
            "You will be redirected to the application website.";


        applyButton.onclick =
            function () {

                if (
                    !openWebsite(value)
                ) {

                    alert(
                        "The application website is invalid."
                    );

                }

            };


        return;

    }


    /* =========================
       EMAIL
    ========================= */

    if (
        method === "email"
    ) {

        applyButton.style.display =
            "inline-flex";


        applyButton.textContent =
            "Apply by Email →";


        applicationText.textContent =
            "Send your application directly to the job poster by email.";


        applicationNote.textContent =
            "Your email application will open in your default mail application.";


        applyButton.onclick =
            function () {

                if (!value) {

                    alert(
                        "The application email is unavailable."
                    );

                    return;

                }


                window.location.href =
                    "mailto:" +
                    value +
                    "?subject=" +
                    encodeURIComponent(
                        `Application for ${job.title}`
                    );

            };


        return;

    }


    /* =========================
       UNKNOWN METHOD
    ========================= */

    applyButton.style.display =
        "none";


    applicationText.textContent =
        "Application information is not available.";

    applicationNote.textContent =
        "";

}


/* =========================================================
   CATEGORY
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
   BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "job-finder.html";

    }
);


/* =========================================================
   START
========================================================= */

loadJob();