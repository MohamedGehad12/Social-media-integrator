

const { NtlmClient, NtlmCredentials } =require( 'axios-ntlm');

(async () => {
    
    let credentials = {
        username: 'omar.sayed',
        password: "sibfo4-zaxhyf-vibwuG"
    }

    let config = {
        baseURL: 'https://cms.guc.edu.eg/',
        method: 'get'
    }

    let client = NtlmClient(credentials, config)

    try {
        let resp = await client.get('/apps/student/HomePageStn.aspx')
        console.log("resp");
    }
    catch (err) {
        console.log(err)
        console.log("Failed")
    }

})()


