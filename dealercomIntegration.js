(async APILoader => {
    const API = await APILoader.create();

    API.subscribe('page-load-v1', async ev => {
        const { accountId, detailPage } = ev.payload;
        API.log(`Account ID: ${accountId}`);
        API.log(`Detail Page: ${detailPage}`);

        if (detailPage) {
            API.subscribe('vehicle-shown-v1', async vehicleEvent => {
                API.log('Vehicle event:', vehicleEvent);

                const vehicleInfo = vehicleEvent.payload.vehicleData;
                const vehicleDetails = {
                    title: `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.trim}`,
                    price: vehicleInfo.finalPrice || vehicleInfo.startingPrice || 'Contact for price',
                    image: vehicleInfo.images[0] || '',
                    vin: vehicleInfo.vin,
                    stockNumber: vehicleInfo.stockNumber,
                    link: vehicleInfo.link
                };

                API.insert('vehicle-media', async (elem, meta) => {
                    API.log('Inserting CTA widget...');
                    const ctaSection = document.createElement('div');
                    ctaSection.id = 'cta-section';
                    ctaSection.className = 'widget';
                    ctaSection.innerHTML = `
                      <section class="widgetSmall">
                        <div class="titleAndDescription">
                          <div class="contentWrapper">
                            <div class="dealerInfo">
                              <img id="dealership-logo" src="" width="200" alt="Dealership logo">
                            </div>
                            <h2 class="title">Need More Info?</h2>
                            <p class="description">Get more information on this vehicle by clicking the button below.</p>
                          </div>
                          <div class="poweredBy">
                            Powered by
                            <img src="/assets/images/logo-main.png" alt="Mi AI Marketing" class="poweredLogo">
                          </div>
                        </div>
                        <div class="formWrapper">
                          <button name="Close widget" type="button" aria-label="Close widget" class="closeWidgetButton">
                            <svg class="closeIcon"><path d="M21.5 12.5L12.5 21.5"></path> <path d="M12.5 12.5L21.5 21.5"></path></svg>
                          </button>
                          <a href="#" class="dialog btn btn-primary" data-width="500" data-title="Get More Information" data-el="#lead-dialog" data-name="lead-form">Click Here</a>
                        </div>
                      </section>
                    `;
                    API.append(elem, ctaSection);

                    // Create hidden dialog content
                    const leadDialog = document.createElement('div');
                    leadDialog.id = 'lead-dialog';
                    leadDialog.className = 'hide';
                    leadDialog.innerHTML = `
                      <div class="lead-dialog-content">
                        <img id="vehicle-image" src="${vehicleDetails.image}" alt="Vehicle Image" />
                        <h2 id="vehicle-title">${vehicleDetails.title}</h2>
                        <p id="vehicle-price">${vehicleDetails.price}</p>
                        <p id="disclaimer"></p>
                        <form id="lead-form">
                          <input type="text" name="first_name" placeholder="First Name" required />
                          <input type="text" name="last_name" placeholder="Last Name" required />
                          <input type="tel" name="phone" placeholder="Phone Number" required />
                          <input type="email" name="email" placeholder="Your email" required />
                          <div id="questions-container"></div>
                          <button type="submit" class="btn btn-primary">Submit</button>
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

                    // Fetch dealership-specific information from Hasura
                    await fetchDealershipInfo(accountId, vehicleDetails);
                });
            });
        }
    });

    async function fetchDealershipInfo(accountId, vehicleDetails) {
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

            // Pass vehicleDetails to lead form script
            const leadForm = document.getElementById('lead-form');
            leadForm.dataset.vehicleDetails = JSON.stringify(vehicleDetails);
        } catch (error) {
            API.log(`Error fetching dealership info: ${error.message}`);
        }
    }

    // Inject CSS
    await API.loadCSS('https://cdn.jsdelivr.net/gh/littlecm/ddcctawidgetsaas@main/styles.css');
})(window.DDC.APILoader);
