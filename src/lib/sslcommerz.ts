
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';

if (!store_id || !store_passwd) {
  throw new Error('SSLCommerz store_id or store_passwd not provided in environment variables');
}

/**
 * Native SSLCommerz Initialization using fetch
 * This avoids external library dependency issues with fetch/axios in Next.js
 */
export async function initPayment(data: any) {
  const baseUrl = is_live 
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

  const formData = new URLSearchParams();
  
  // Add required authentication fields
  formData.append('store_id', store_id!);
  formData.append('store_passwd', store_passwd!);
  
  // Add all other dynamic fields
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key].toString());
    }
  });

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SSLCommerz API Error:', response.status, errorText);
      throw new Error(`SSLCommerz API responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SSLCommerz Initialization Failed:', error);
    throw error;
  }
}

/**
 * Native SSLCommerz Validation using fetch
 */
export async function validatePayment(data: any) {
  const val_id = data.val_id;
  if (!val_id) {
    console.error('SSLCommerz Validation Error: Missing val_id in data');
    return null;
  }

  const baseUrl = is_live 
    ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php' 
    : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

  const params = new URLSearchParams({
    val_id: val_id.toString(),
    store_id: store_id!,
    store_passwd: store_passwd!,
    format: 'json'
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('SSLCommerz Validation Server Error:', response.status, errorText);
        return null;
    }
    return await response.json();
  } catch (error) {
    console.error('SSLCommerz Validation Failed:', error);
    return null;
  }
}
