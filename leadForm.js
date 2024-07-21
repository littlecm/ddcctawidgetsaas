document.addEventListener("DOMContentLoaded", function() {
    const leadForm = document.getElementById('lead-form');

    // Handle form submission
    leadForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(leadForm);
        const selectedQuestions = formData.getAll('questions').join(', ');
        const firstName = formData.get('first_name');
        const lastName = formData.get('last_name');
        const phone = formData.get('phone');
        const email = formData.get('email');
        const accountId = document.getElementById('dealership-logo').dataset.accountId;
        const vehicleDetails = JSON.parse(leadForm.dataset.vehicleDetails);

        const leadData = {
            account_id: accountId,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            questions: selectedQuestions,
            vehicle_title: vehicleDetails.title,
            vehicle_price: vehicleDetails.price,
            vehicle_vin: vehicleDetails.vin,
            vehicle_stock_number: vehicleDetails.stockNumber,
            vehicle_link: vehicleDetails.link,
            submitted_at: new Date().toISOString()
        };

        try {
            const response = await fetch('https://hasura-production-e37d.up.railway.app/api/rest/cta_widget_lead_submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query: `
                      mutation insert_cta_widget_lead_submissions_one($object: cta_widget_lead_submissions_insert_input!) {
                        insert_cta_widget_lead_submissions_one(object: $object) {
                          account_id
                          first_name
                          last_name
                          phone
                          email
                          questions
                          vehicle_title
                          vehicle_price
                          vehicle_vin
                          vehicle_stock_number
                          vehicle_link
                          submitted_at
                        }
                      }
                    `,
                    variables: { object: leadData }
                })
            });

            const result = await response.json();
            console.log(`Lead submission response: ${JSON.stringify(result)}`);
            alert('Your request has been submitted!');
            document.querySelector('#lead-dialog').classList.add('hide');
        } catch (error) {
            console.error(`Error submitting lead: ${error.message}`);
        }
    });
});
