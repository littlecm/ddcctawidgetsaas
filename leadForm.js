document.addEventListener("DOMContentLoaded", function() {
    const leadForm = document.getElementById('lead-form');

    // Handle form submission
    leadForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(leadForm);
        const selectedQuestions = formData.getAll('questions').join(', ');
        const email = formData.get('email');
        const accountId = document.getElementById('dealership-logo').dataset.accountId;

        const leadData = {
            account_id: accountId,
            email: email,
            questions: selectedQuestions,
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
                          email
                          id
                          questions
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
