(async APILoader => {
    const API = await APILoader.create();

    API.subscribe('page-load-v1', async ev => {
        const { accountId, detailPage } = ev.payload;
        API.log(`Account ID: ${accountId}`);
        API.log(`Detail Page: ${detailPage}`);

        if (detailPage) {
            API.insert('vehicle-media', async (elem, meta) => {
                API.log('Inserting CTA widget...');
                const ctaSection = document.createElement('div');
                ctaSection.id = 'cta-section';
                ctaSection.className = 'cta-section';
                ctaSection.innerHTML = `
                  <div class="cta-content">
                    <h3>Need More Info?</h3>
                    <p>Get more information on this vehicle by clicking the button below.</p>
                    <a href="#" class="dialog btn btn-primary" data-width="500" data-title="Get More Information" data-el="#lead-dialog" data-name="lead-form">Click Here</a>
                  </div>
                `;
                API.append(elem, ctaSection);

                // Create hidden dialog content
                const leadDialog = document.createElement('div');
                leadDialog.id = 'lead-dialog';
                leadDialog.className = 'hide';
                leadDialog.innerHTML = `
                  <div class="lead-dialog-content">
                    <img id="dealership-logo" src="" alt="Dealership Logo" data-account-id="${accountId}" />
                    <p id="disclaimer"></p>
                    <form id="lead-form">
                      <input type="email" name="email" placeholder="Your email" required />
                      <div id="questions-container"></div>
                      <button type="submit" class="btn btn-primary">Submit</button>
                    </form>
                  </div>
                `;
                document.body.appendChild(leadDialog);

                const leadFormScript = document.createElement('script');
                leadFormScript.src = 'path/to/leadForm.js'; // Adjust the path as needed
                leadFormScript.onload = () => {
                    API.log('Lead form script loaded.');
                };
                document.body.appendChild(leadFormScript);

                // Fetch dealership-specific information from Hasura
                await fetchDealershipInfo(accountId);
            });
        }
    });

    async function fetchDealershipInfo(accountId) {
        API.log(`Fetching dealership info for Account ID: ${accountId}`);
        try {
            const response = await fetch(`https://hasura-production-e37d.up.railway.app/api/rest/dealerships_leads_info_cta_widget/${accountId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            const dealership = result.dealerships_leads_info_cta_widget_by_pk;
            API.log(`Dealership info retrieved: ${JSON.stringify(dealership)}`);

            document.getElementById('dealership-logo').src = dealership.logo_url;
            document.getElementById('disclaimer').textContent = dealership.custom_disclaimer;

            // Populate form with dealership-specific questions
            const questionsContainer = document.getElementById('questions-container');
            const questions = [
                { enabled: dealership.enable_photos, text: "Can you send me photos of this vehicle?" },
                { enabled: dealership.enable_walkaround_video, text: "Can you send me a walk-around video of this vehicle?" },
                { enabled: dealership.enable_availability, text: "Is this car still available?" },
                { enabled: dealership.enable_location, text: "Where is this car located?" },
                { enabled: dealership.enable_similar_cars, text: "Do you have other cars that are similar?" },
                { enabled: dealership.enable_test_drive, text: "Schedule a test drive" },
                { enabled: dealership.enable_price_change_alert, text: "Sign up for price change alerts" },
                { enabled: dealership.enable_sold_alert, text: "Let me know when this vehicle is sold" },
                { enabled: dealership.enable_new_stock_alert, text: "Let me know when similar vehicles come in stock" },
                { enabled: dealership.enable_sale_alert, text: "Notify me when this car goes on sale" }
            ];

            questions.forEach(question => {
                if (question.enabled) {
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="checkbox" name="questions" value="${question.text}"> ${question.text}`;
                    questionsContainer.appendChild(label);
                }
            });
        } catch (error) {
            API.log(`Error fetching dealership info: ${error.message}`);
        }
    }
})(window.DDC.APILoader);
