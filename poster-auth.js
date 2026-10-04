/* =========================================================
   POSTER AUTHENTICATION
   =========================================================

   IMPORTANT:

   This is currently a FRONTEND DEMO

   localStorage is being used temporarily

   Later these functions can be replaced with:

       API => Backend => Database

   without redesigning the UI
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const ACCOUNT_KEY =
    "jobPosterAccount";

const SESSION_KEY =
    "jobPosterLoggedIn";


/* =========================================================
   AUTH VIEWS
========================================================= */

const loginView =
    document.getElementById("loginView");

const signupView =
    document.getElementById("signupView");

const verificationView =
    document.getElementById("verificationView");


/* =========================================================
   BUTTONS
========================================================= */

const showSignup =
    document.getElementById("showSignup");

const showLogin =
    document.getElementById("showLogin");

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );


/* =========================================================
   FORMS
========================================================= */

const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");

const verificationForm =
    document.getElementById(
        "verificationForm"
    );

const forgotForm =
    document.getElementById(
        "forgotForm"
    );


/* =========================================================
   INPUTS
========================================================= */

const loginEmail =
    document.getElementById(
        "loginEmail"
    );

const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const signupName =
    document.getElementById(
        "signupName"
    );

const signupEmail =
    document.getElementById(
        "signupEmail"
    );

const signupPassword =
    document.getElementById(
        "signupPassword"
    );

const signupConfirmPassword =
    document.getElementById(
        "signupConfirmPassword"
    );

const termsCheckbox =
    document.getElementById(
        "termsCheckbox"
    );


/* =========================================================
   VERIFICATION
========================================================= */

const otpInputs =
    document.querySelectorAll(
        ".otp-input"
    );

const verificationEmail =
    document.getElementById(
        "verificationEmail"
    );

const verificationPreview =
    document.getElementById(
        "verificationPreview"
    );

const resendCode =
    document.getElementById(
        "resendCode"
    );

const resendTimer =
    document.getElementById(
        "resendTimer"
    );


let pendingAccount = null;

let verificationCode = null;

let resendInterval = null;


/* =========================================================
   MODALS
========================================================= */

const forgotModal =
    document.getElementById(
        "forgotModal"
    );

const termsModal =
    document.getElementById(
        "termsModal"
    );

const termsButton =
    document.getElementById(
        "termsButton"
    );


/* =========================================================
   TOAST
========================================================= */

const toast =
    document.getElementById(
        "toast"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );

let toastTimeout;


/* =========================================================
   SWITCH LOGIN / SIGNUP
========================================================= */

showSignup.addEventListener(
    "click",
    function () {

        clearAllErrors();

        switchView(
            signupView
        );

    }
);


showLogin.addEventListener(
    "click",
    function () {

        clearAllErrors();

        switchView(
            loginView
        );

    }
);


/* =========================================================
   SWITCH VIEW
========================================================= */

function switchView(view) {

    loginView.classList.remove(
        "active"
    );

    signupView.classList.remove(
        "active"
    );

    verificationView.classList.remove(
        "active"
    );


    view.classList.add(
        "active"
    );

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function isValidPassword(password) {

    return (
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /[0-9]/.test(password)
    );

}


/* =========================================================
   ERROR HELPERS
========================================================= */

function setError(
    input,
    errorElement,
    message
) {

    input.classList.add(
        "input-error"
    );

    input.classList.remove(
        "input-success"
    );

    errorElement.textContent =
        message;

}


function setSuccess(
    input,
    errorElement
) {

    input.classList.remove(
        "input-error"
    );

    input.classList.add(
        "input-success"
    );

    errorElement.textContent =
        "";

}


function clearError(
    input,
    errorElement
) {

    input.classList.remove(
        "input-error"
    );

    input.classList.remove(
        "input-success"
    );

    errorElement.textContent =
        "";

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        clearLoginErrors();


        const email =
            loginEmail.value.trim()
                .toLowerCase();

        const password =
            loginPassword.value;


        let valid = true;


        /* Email */

        if (!email) {

            setError(
                loginEmail,
                document.getElementById(
                    "loginEmailError"
                ),
                "Email address is required."
            );

            valid = false;

        } else if (
            !isValidEmail(email)
        ) {

            setError(
                loginEmail,
                document.getElementById(
                    "loginEmailError"
                ),
                "Please enter a valid email address."
            );

            valid = false;

        }


        /* Password */

        if (!password) {

            setError(
                loginPassword,
                document.getElementById(
                    "loginPasswordError"
                ),
                "Password is required."
            );

            valid = false;

        }


        if (!valid) {

            return;

        }

        const submitButton =
            loginForm.querySelector(
                "button[type='submit']"
            );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            const result =
                await JoblyAPI.request(
                    "/auth/login",
                    {
                        method: "POST",
                        body: { email, password }
                    }
                );

            loginSuccessful(
                result
            );

        } catch (error) {

            showFormMessage(
                "loginMessage",
                error.message
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }

        }

    }
);


/* =========================================================
   SIGNUP
========================================================= */

signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        clearSignupErrors();


        const name =
            signupName.value.trim();

        const email =
            signupEmail.value.trim()
                .toLowerCase();

        const password =
            signupPassword.value;

        const confirmPassword =
            signupConfirmPassword.value;


        let valid = true;


        /* Name */

        if (!name) {

            setError(
                signupName,
                document.getElementById(
                    "signupNameError"
                ),
                "Full name is required."
            );

            valid = false;

        } else if (
            name.length < 2
        ) {

            setError(
                signupName,
                document.getElementById(
                    "signupNameError"
                ),
                "Please enter your full name."
            );

            valid = false;

        }


        /* Email */

        if (!email) {

            setError(
                signupEmail,
                document.getElementById(
                    "signupEmailError"
                ),
                "Email address is required."
            );

            valid = false;

        } else if (
            !isValidEmail(email)
        ) {

            setError(
                signupEmail,
                document.getElementById(
                    "signupEmailError"
                ),
                "Please enter a valid email address."
            );

            valid = false;

        }


        /* Password */

        if (!password) {

            setError(
                signupPassword,
                document.getElementById(
                    "signupPasswordError"
                ),
                "Password is required."
            );

            valid = false;

        } else if (
            !isValidPassword(password)
        ) {

            setError(
                signupPassword,
                document.getElementById(
                    "signupPasswordError"
                ),
                "Password must contain 8 characters, including letters and numbers."
            );

            valid = false;

        }


        /* Confirm password */

        if (!confirmPassword) {

            setError(
                signupConfirmPassword,
                document.getElementById(
                    "signupConfirmPasswordError"
                ),
                "Please confirm your password."
            );

            valid = false;

        } else if (
            password !== confirmPassword
        ) {

            setError(
                signupConfirmPassword,
                document.getElementById(
                    "signupConfirmPasswordError"
                ),
                "Passwords do not match."
            );

            valid = false;

        }


        /* Terms */

        if (
            !termsCheckbox.checked
        ) {

            document.getElementById(
                "termsError"
            ).textContent =
                "You must accept the Terms & Conditions.";

            valid = false;

        }


        if (!valid) {

            return;

        }




        const submitButton =
            signupForm.querySelector(
                "button[type='submit']"
            );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            const result =
                await JoblyAPI.request(
                    "/auth/signup",
                    {
                        method: "POST",
                        body: { name, email, password }
                    }
                );

            loginSuccessful(
                result
            );

        } catch (error) {

            showFormMessage(
                "signupMessage",
                error.message
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }

        }

    }
);


/* =========================================================
   LOGIN SUCCESSFUL
========================================================= */

function loginSuccessful(
    result
) {

    JoblyAPI.setSession(
        result.token,
        result.user
    );

    showToast(
        `Welcome, ${result.user.name}.`
    );

    setTimeout(
        function () {

            window.location.href =
                "job-finder.html";

        },
        900
    );

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPasswordButton.addEventListener(
    "click",
    function () {

        document.getElementById(
            "forgotEmail"
        ).value =
            loginEmail.value.trim();


        openModal(
            forgotModal
        );

    }
);


forgotForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const emailInput =
            document.getElementById(
                "forgotEmail"
            );

        const error =
            document.getElementById(
                "forgotEmailError"
            );

        const message =
            document.getElementById(
                "forgotMessage"
            );


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        error.textContent =
            "";

        message.textContent =
            "";


        if (!email) {

            error.textContent =
                "Email address is required.";

            return;

        }


        if (
            !isValidEmail(email)
        ) {

            error.textContent =
                "Please enter a valid email address.";

            return;

        }


        /*
            TEMPORARY RESPONSE

            Later this becomes:
            POST /api/auth/forgot-password
        */

        message.className =
            "form-message success-message";


        message.textContent =
            "Reset request prepared successfully. In the live version, a reset email will be sent here.";


        setTimeout(
            function () {

                closeModal(
                    forgotModal
                );

            },
            1800
        );

    }
);


/* =========================================================
   TERMS MODAL
========================================================= */

termsButton.addEventListener(
    "click",
    function () {

        openModal(
            termsModal
        );

    }
);


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal(modal) {

    modal.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(modal) {

    modal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";

}


/* =========================================================
   CLOSE BUTTONS
========================================================= */

document.querySelectorAll(
    "[data-close]"
)
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const modalId =
                        button.dataset.close;

                    const modal =
                        document.getElementById(
                            modalId
                        );

                    closeModal(
                        modal
                    );

                }
            );

        }
    );


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

document.querySelectorAll(
    ".modal-overlay"
)
    .forEach(
        function (overlay) {

            overlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closeModal(
                            overlay
                        );

                    }

                }
            );

        }
    );


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        document.querySelectorAll(
            ".modal-overlay.active"
        )
            .forEach(
                function (modal) {

                    closeModal(
                        modal
                    );

                }
            );

    }
);


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

document.querySelectorAll(
    ".password-toggle"
)
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset.target;

                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        button.textContent =
                            "Hide";

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "Show";

                    }

                }
            );

        }
    );


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

signupPassword.addEventListener(
    "input",
    function () {

        const password =
            signupPassword.value;


        const strength =
            document.getElementById(
                "passwordStrength"
            );


        strength.className =
            "password-strength";


        if (!password) {

            return;

        }


        if (
            password.length < 8
        ) {

            strength.classList.add(
                "weak"
            );

            return;

        }


        const hasLetters =
            /[A-Za-z]/.test(
                password
            );

        const hasNumbers =
            /[0-9]/.test(
                password
            );

        const hasSpecial =
            /[^A-Za-z0-9]/.test(
                password
            );


        if (
            hasLetters &&
            hasNumbers &&
            hasSpecial &&
            password.length >= 10
        ) {

            strength.classList.add(
                "strong"
            );

        } else {

            strength.classList.add(
                "medium"
            );

        }

    }
);


/* =========================================================
   LIVE FIELD VALIDATION
========================================================= */

signupEmail.addEventListener(
    "blur",
    function () {

        const error =
            document.getElementById(
                "signupEmailError"
            );


        if (
            !signupEmail.value.trim()
        ) {

            setError(
                signupEmail,
                error,
                "Email address is required."
            );

        } else if (
            !isValidEmail(
                signupEmail.value.trim()
            )
        ) {

            setError(
                signupEmail,
                error,
                "Please enter a valid email address."
            );

        } else {

            setSuccess(
                signupEmail,
                error
            );

        }

    }
);


signupConfirmPassword.addEventListener(
    "input",
    function () {

        const error =
            document.getElementById(
                "signupConfirmPasswordError"
            );


        if (
            signupConfirmPassword.value ===
            signupPassword.value &&
            signupConfirmPassword.value
        ) {

            setSuccess(
                signupConfirmPassword,
                error
            );

        }

    }
);


/* =========================================================
   CLEAR ERRORS
========================================================= */

function clearLoginErrors() {

    clearError(
        loginEmail,
        document.getElementById(
            "loginEmailError"
        )
    );


    clearError(
        loginPassword,
        document.getElementById(
            "loginPasswordError"
        )
    );


    document.getElementById(
        "loginMessage"
    ).textContent = "";

}


function clearSignupErrors() {

    clearError(
        signupName,
        document.getElementById(
            "signupNameError"
        )
    );


    clearError(
        signupEmail,
        document.getElementById(
            "signupEmailError"
        )
    );


    clearError(
        signupPassword,
        document.getElementById(
            "signupPasswordError"
        )
    );


    clearError(
        signupConfirmPassword,
        document.getElementById(
            "signupConfirmPasswordError"
        )
    );


    document.getElementById(
        "termsError"
    ).textContent = "";


    document.getElementById(
        "signupMessage"
    ).textContent = "";

}


/* =========================================================
   CLEAR ALL ERRORS
========================================================= */

function clearAllErrors() {

    clearLoginErrors();

    clearSignupErrors();

}


/* =========================================================
   FORM MESSAGE
========================================================= */

function showFormMessage(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    element.className =
        "form-message error-message";


    element.textContent =
        message;

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
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}