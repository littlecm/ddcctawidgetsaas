(async APILoader => {
    const API = await APILoader.create();

    API.subscribe('page-load-v1', async ev => {
        const { accountId, detailPage } = ev.payload;
        API.log(`Account ID: ${accountId}`);
        API.log(`Detail Page: ${detailPage}`);

        if (detailPage) {
            API.insert('vehicle-media', async (elem, meta) => {
                API.log('Inserting CTA widget...');
                const leadDialog = document.createElement('div');
                leadDialog.id = 'lead-dialog';
                leadDialog.className = 'lead-dialog hidden';
                leadDialog.innerHTML = `
                  <div class="lead-dialog-content">
                    <img id="dealership-logo" src="" alt="Dealership Logo" />
                    <p id="disclaimer"></p>
                    <form id="lead-form">
                      <input type="email" name="email" placeholder="Your email" required />
                      <button type="submit">Submit</button>
                    </form>
                  </div>
                `;
                document.body.appendChild(leadDialog);

                const leadFormScript = document.createElement('script');
                leadFormScript.src = 'https://cdn.jsdelivr.net/gh/littlecm/ddcctawidgetsaas@main/leadForm.js'; // Adjust the path as needed
                leadFormScript.onload = () => {
                    API.log('Lead form script loaded.');
                };
                document.body.appendChild(leadFormScript);

                const ctaButton = document.createElement('button');
                ctaButton.id = 'cta-button';
                ctaButton.className = 'cta-button';
                ctaButton.textContent = 'Need more info? Ask here!';
                ctaButton.addEventListener('click', () => {
                    leadDialog.classList.remove('hidden');
                    leadDialog.style.display = 'block';
                });

                API.append(elem, ctaButton);

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
            const leadForm = document.getElementById('lead-form');
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
                    leadForm.insertBefore(label, leadForm.querySelector('input[type="email"]'));
                }
            });
        } catch (error) {
            API.log(`Error fetching dealership info: ${error.message}`);
        }
    }
})(window.DDC.APILoader);
