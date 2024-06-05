"use client"
import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

const RegisterComponent: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRegistration = async () => {
    // Reset success/error messages
    setSuccessMessage('');
    setErrorMessage('');

    // GET registration options from the endpoint that calls
    // @simplewebauthn/server -> generateRegistrationOptions()
    const resp = await fetch('/api/generate-registration-options');

    let attResp;
    try {
      // Pass the options to the authenticator and wait for a response
      attResp = await startRegistration(await resp.json());
    } catch (error: any) {
      // Some basic error handling
      if (error.name === 'InvalidStateError') {
        setErrorMessage('Error: Authenticator was probably already registered by user');
      } else {
        setErrorMessage(error.toString());
      }

      throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyRegistrationResponse()
    const verificationResp = await fetch('/verify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
      setSuccessMessage('Success!');
    } else {
      setErrorMessage(`Oh no, something went wrong! Response: <pre>${JSON.stringify(verificationJSON)}</pre>`);
    }
  };

  return (
    <div>
      <button className='bg-red-700' id="btnBegin" onClick={handleRegistration}>Begin Registration</button>
      <div className='bg-blue-400' id="success" dangerouslySetInnerHTML={{ __html: successMessage }} />
      <div className='bg-green-500' id="error" dangerouslySetInnerHTML={{ __html: errorMessage }} />
    </div>
  );
};

export default RegisterComponent;
