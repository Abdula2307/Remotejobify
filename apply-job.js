<!doctype html>
<html lang="en">

<head>

    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>RemotifyJobs — Apply for Job</title>

    <meta
        name="description"
        content="Review job information and apply on RemotifyJobs."
    />

    <link
        rel="stylesheet"
        href="apply-job.css"
    />

</head>


<body>

    <div class="page-background"></div>


    <!-- =========================
         NAVBAR
    ========================== -->

    <header class="navbar">

        <a
            href="job-finder.html"
            class="logo"
        >
            Remotify<span>Jobs</span>
        </a>


        <div class="nav-right">

            <span class="page-label">
                Apply for Job
            </span>

        </div>

    </header>


    <!-- =========================
         MAIN
    ========================== -->

    <main class="main-container">

        <section class="apply-hero">

            <div class="hero-label">

                <span class="hero-dot"></span>

                Job application

            </div>


            <h1>

                Apply for this
                <span>opportunity.</span>

            </h1>


            <p>
                Review the job information below before contacting
                the job poster.
            </p>

        </section>


        <!-- =========================
             JOB INFORMATION
        ========================== -->

        <section
            class="application-card"
            id="applicationCard"
        >

            <div class="job-category"
                 id="jobCategory">
                Job Opportunity
            </div>


            <h2 id="jobTitle">
                Job Title
            </h2>


            <p
                class="company"
                id="jobCompany"
            >
                Company
            </p>


            <div class="job-meta">

                <div class="meta-item">

                    <span class="location-icon"></span>

                    <span id="jobLocation">
                        Location
                    </span>

                </div>


                <div class="meta-item">

                    <span class="vacancy-icon"></span>

                    <span id="jobVacancies">
                        0 Vacancies
                    </span>

                </div>

            </div>


            <div class="divider"></div>


            <!-- =========================
                 DESCRIPTION
            ========================== -->

            <div class="job-description-section">

                <h3>
                    About this position
                </h3>

                <p id="jobDescription">
                    Job description
                </p>

            </div>


            <!-- =========================
                 APPLICATION
            ========================== -->

            <div class="application-section">

                <h3>
                    How to apply
                </h3>


                <p id="applicationText">
                    Contact the job poster directly.
                </p>


                <button
                    id="applyButton"
                    class="apply-whatsapp-button"
                    type="button"
                >

                    Apply on WhatsApp

                    <span>→</span>

                </button>


                <p
                    class="application-note"
                    id="applicationNote"
                >
                    You will be redirected to WhatsApp.
                </p>

            </div>

        </section>


        <!-- =========================
             BACK
        ========================== -->

        <div class="back-wrapper">

            <button
                type="button"
                id="backButton"
                class="back-button"
            >
                ← Back to Jobs
            </button>

        </div>

    </main>


    <script src="api.js"></script>
    <script src="apply-job.js"></script>

</body>

</html>
