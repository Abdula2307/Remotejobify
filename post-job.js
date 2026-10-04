/* Only logged-in posters can use this page */
if (!JoblyAPI.isPoster()) {
    window.location.href = "poster-auth.html";
}

/* =====================================================
   ELEMENTS
===================================================== */

const postJobForm =
    document.getElementById("postJobForm");

const jobTitle =
    document.getElementById("jobTitle");

const companyName =
    document.getElementById("companyName");

const jobLocation =
    document.getElementById("jobLocation");

const vacancies =
    document.getElementById("vacancies");

const jobDescription =
    document.getElementById("jobDescription");

const descriptionCount =
    document.getElementById("descriptionCount");

const applyMethods =
    document.querySelectorAll(".apply-method");

const applyValue =
    document.getElementById("applyValue");

const applyValueLabel =
    document.getElementById("applyValueLabel");

const applyValueHint =
    document.getElementById("applyValueHint");

const previewTitle =
    document.getElementById("previewTitle");

const previewCompany =
    document.getElementById("previewCompany");

const previewLocation =
    document.getElementById("previewLocation");

const previewVacancies =
    document.getElementById("previewVacancies");

const previewDescription =
    document.getElementById("previewDescription");

const cancelButton =
    document.getElementById("cancelButton");

const successModal =
    document.getElementById("successModal");

const successModalClose =
    document.getElementById("successModalClose");

const viewJobsButton =
    document.getElementById("viewJobsButton");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =====================================================
   CURRENT APPLY METHOD
===================================================== */

let selectedApplyMethod = "whatsapp";


/* =====================================================
   DEFAULT PREVIEW
===================================================== */

function updatePreview() {

    const title =
        jobTitle.value.trim();

    const company =
        companyName.value.trim();

    const location =
        jobLocation.value.trim();

    const vacancyNumber =
        vacancies.value.trim();

    const description =
        jobDescription.value.trim();


    previewTitle.textContent =
        title || "Your job title";


    previewCompany.textContent =
        company || "Company name";


    previewLocation.textContent =
        location || "Location";


    if (vacancyNumber) {

        previewVacancies.textContent =
            `${vacancyNumber} ${Number(vacancyNumber) === 1
                ? "Vacancy"
                : "Vacancies"
            }`;

    } else {

        previewVacancies.textContent =
            "0 Vacancies";

    }


    previewDescription.textContent =
        description ||
        "Your job description will appear here.";
}


/* =====================================================
   LIVE PREVIEW
===================================================== */

jobTitle.addEventListener(
    "input",
    updatePreview
);


companyName.addEventListener(
    "input",
    updatePreview
);


jobLocation.addEventListener(
    "input",
    updatePreview
);


vacancies.addEventListener(
    "input",
    updatePreview
);


jobDescription.addEventListener(
    "input",
    function () {

        updatePreview();

        const length =
            jobDescription.value.length;

        descriptionCount.textContent =
            `${length} character${length === 1 ? "" : "s"
            }`;
    }
);


/* =====================================================
   APPLY METHOD SWITCHING
===================================================== */

applyMethods.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                applyMethods.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedApplyMethod =
                    button.dataset.method;


                updateApplyField();

            }
        );

    }
);


/* =====================================================
   APPLY FIELD
===================================================== */

function updateApplyField() {

    if (
        selectedApplyMethod ===
        "whatsapp"
    ) {

        applyValueLabel.innerHTML =
            'WhatsApp Number <span>*</span>';

        applyValue.placeholder =
            "e.g. +92 300 1234567";

        applyValueHint.textContent =
            "Enter the WhatsApp number applicants should contact.";

        applyValue.type =
            "tel";

    }


    else if (
        selectedApplyMethod ===
        "website"
    ) {

        applyValueLabel.innerHTML =
            'Application Website URL <span>*</span>';

        applyValue.placeholder =
            "https://example.com/apply";

        applyValueHint.textContent =
            "Enter the website URL where applicants can apply.";

        applyValue.type =
            "url";

    }


    else if (
        selectedApplyMethod ===
        "email"
    ) {

        applyValueLabel.innerHTML =
            'Application Email <span>*</span>';

        applyValue.placeholder =
            "jobs@example.com";

        applyValueHint.textContent =
            "Enter the email address applicants should use.";

        applyValue.type =
            "email";

    }


    applyValue.value = "";

    clearFieldError(
        applyValue,
        "applyValueError"
    );
}


/* =====================================================
   ERROR HELPERS
===================================================== */

function showFieldError(
    input,
    errorId,
    message
) {

    const error =
        document.getElementById(errorId);

    const group =
        input.closest(".form-group");


    if (error) {

        error.textContent =
            message;

    }


    if (group) {

        group.classList.add(
            "input-error"
        );

    }

}


function clearFieldError(
    input,
    errorId
) {

    const error =
        document.getElementById(errorId);

    const group =
        input.closest(".form-group");


    if (error) {

        error.textContent =
            "";

    }


    if (group) {

        group.classList.remove(
            "input-error"
        );

    }

}


/* =====================================================
   VALIDATION
===================================================== */

function validateForm() {

    let isValid = true;


    /* ---------------------------------
       JOB TITLE
    --------------------------------- */

    if (
        jobTitle.value.trim() === ""
    ) {

        showFieldError(
            jobTitle,
            "jobTitleError",
            "Please enter a job title."
        );

        isValid = false;

    } else {

        clearFieldError(
            jobTitle,
            "jobTitleError"
        );

    }


    /* ---------------------------------
       COMPANY
    --------------------------------- */

    if (
        companyName.value.trim() === ""
    ) {

        showFieldError(
            companyName,
            "companyNameError",
            "Please enter the company name."
        );

        isValid = false;

    } else {

        clearFieldError(
            companyName,
            "companyNameError"
        );

    }


    /* ---------------------------------
       LOCATION
    --------------------------------- */

    if (
        jobLocation.value.trim() === ""
    ) {

        showFieldError(
            jobLocation,
            "jobLocationError",
            "Please enter the job location."
        );

        isValid = false;

    } else {

        clearFieldError(
            jobLocation,
            "jobLocationError"
        );

    }


    /* ---------------------------------
       VACANCIES
    --------------------------------- */

    const vacancyValue =
        Number(vacancies.value);


    if (
        vacancies.value.trim() === "" ||
        !Number.isInteger(vacancyValue) ||
        vacancyValue < 1
    ) {

        showFieldError(
            vacancies,
            "vacanciesError",
            "Please enter at least 1 vacancy."
        );

        isValid = false;

    } else {

        clearFieldError(
            vacancies,
            "vacanciesError"
        );

    }


    /* ---------------------------------
       DESCRIPTION
    --------------------------------- */

    if (
        jobDescription.value.trim() === ""
    ) {

        showFieldError(
            jobDescription,
            "jobDescriptionError",
            "Please enter a job description."
        );

        isValid = false;

    } else if (
        jobDescription.value.trim().length < 20
    ) {

        showFieldError(
            jobDescription,
            "jobDescriptionError",
            "Description should be at least 20 characters."
        );

        isValid = false;

    } else {

        clearFieldError(
            jobDescription,
            "jobDescriptionError"
        );

    }


    /* ---------------------------------
       APPLY VALUE
    --------------------------------- */

    const applyText =
        applyValue.value.trim();


    if (applyText === "") {

        showFieldError(
            applyValue,
            "applyValueError",
            "Please enter your application details."
        );

        isValid = false;

    }


    else if (
        selectedApplyMethod ===
        "email"
    ) {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailPattern.test(
                applyText
            )
        ) {

            showFieldError(
                applyValue,
                "applyValueError",
                "Please enter a valid email address."
            );

            isValid = false;

        } else {

            clearFieldError(
                applyValue,
                "applyValueError"
            );

        }

    }


    else if (
        selectedApplyMethod ===
        "website"
    ) {

        let validURL = false;


        try {

            const url =
                new URL(applyText);

            validURL =
                url.protocol === "http:" ||
                url.protocol === "https:";

        } catch (error) {

            validURL = false;

        }


        if (!validURL) {

            showFieldError(
                applyValue,
                "applyValueError",
                "Please enter a valid website URL."
            );

            isValid = false;

        } else {

            clearFieldError(
                applyValue,
                "applyValueError"
            );

        }

    }


    else {

        clearFieldError(
            applyValue,
            "applyValueError"
        );

    }


    return isValid;
}


/* =====================================================
   SAVE JOB
===================================================== */

async function saveJob(jobData) {

    return JoblyAPI.request(
        "/jobs",
        {
            method: "POST",
            body: jobData
        }
    );

}


/* =====================================================
   CREATE JOB DATA
===================================================== */

const jobCategory =
    document.getElementById(
        "jobCategory"
    );


function createJobData() {

    return {

        id:
            "job_" +
            Date.now(),

        title:
            jobTitle.value.trim(),

        company:
            companyName.value.trim(),

        location:
            jobLocation.value.trim(),

        vacancies:
            Number(
                vacancies.value
            ),

        category:
            jobCategory.value,

        description:
            jobDescription.value.trim(),

        applyMethod:
            selectedApplyMethod,

        applyValue:
            applyValue.value.trim(),

        postedAt:
            new Date().toISOString()

    };

}


/* =====================================================
   FORM SUBMIT
===================================================== */

postJobForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const valid =
            validateForm();


        if (!valid) {

            showToast(
                "Please fix the highlighted fields."
            );

            return;

        }


        const jobData =
            createJobData();


        const submitButton =
            postJobForm.querySelector(
                "button[type='submit']"
            );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            await saveJob(
                jobData
            );

            showSuccessModal();

            showToast(
                "Job posted successfully."
            );

        } catch (error) {

            showToast(
                error.message
            );

            if (!JoblyAPI.isPoster()) {
                setTimeout(function () {
                    window.location.href =
                        "poster-auth.html";
                }, 1200);
            }

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }

        }

    }
);


/* =====================================================
   SUCCESS MODAL
===================================================== */

function showSuccessModal() {

    successModal.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";
}


function closeSuccessModal() {

    successModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


/* =====================================================
   MODAL CLOSE
===================================================== */

successModalClose.addEventListener(
    "click",
    closeSuccessModal
);


/* =====================================================
   VIEW JOBS
===================================================== */

viewJobsButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "job-finder.html";

    }
);


/* =====================================================
   CLICK OUTSIDE MODAL
===================================================== */

successModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            successModal
        ) {

            closeSuccessModal();

        }

    }
);


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            successModal.classList.contains("show")
        ) {

            closeSuccessModal();

        }

    }
);


/* =====================================================
   CANCEL BUTTON
===================================================== */

cancelButton.addEventListener(
    "click",
    function () {

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel? Your entered information will be lost."
            );


        if (confirmed) {

            window.location.href =
                "job-finder.html";

        }

    }
);


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


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


/* =====================================================
   INITIALIZE
===================================================== */

updatePreview();

updateApplyField();