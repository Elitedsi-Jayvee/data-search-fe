import axios from 'axios'
// For storing pending requests
const pendingRequests = new Map()

const instance = axios.create({
  baseURL: import.meta.env.DATA_SEARCH_API,
})

const findVueComponentInStack = () => {
  try {
    const err = new Error();
    const stackLines = err.stack.split('\n');

    for (const line of stackLines) {
      //Only for vue file
      const match = line.match(/\/([^\/]+\.vue)/);
      if (match) {
        return match[1];
      }
    }
  } catch (e) {
    return 'Stack Parse Error';
  }
  return 'No .vue File in Stack';
};

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // console.log(config.apiUrl)
    if (config.apiUrl) {
      config.baseURL = config.apiUrl;
    }

    // Handle request cancellation
    const { finalUrl, requestKey } = getRequestDetails(config);
    config.url = finalUrl;


    // Create new AbortController for this request
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code === 9) {
      router.push({ name: 'UnderMaintenance' });
      return Promise.reject(new Error('Site is in maintenance mode.'));
    }

    // Remove from pending requests
    const { requestKey } = getRequestDetails(response.config)
    pendingRequests.delete(requestKey)

    return response
  },
  (error) => {
    // Handle cancelled requests
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message)
      return Promise.reject({ isCancelled: true, error })
    }

    // Remove from pending requests if there was an error
    if (error.config) {
      const { requestKey } = getRequestDetails(error.config)
      pendingRequests.delete(requestKey)
    }

    return Promise.reject(error)
  }
)

// Helper function to cancel a specific request
const getRequestDetails = (config) => {
  const caller = findVueComponentInStack();

  let finalUrl = config.url;
  if (config.data && config.data.request && config.data.type) {
    const isProduction = import.meta.env.MODE === 'production';
    const params = new URLSearchParams();
    params.append('r', config.data.request);
    params.append('t', config.data.type);
    params.append('c', caller);

    finalUrl = isProduction ? config.url : `${config.url}?${params.toString()}`;
  }
  const requestKey = `${config.method}_${config.baseURL}${finalUrl}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`;
  return {
    finalUrl,
    requestKey
  };
};


export const cancelRequest = (config) => {
  // Regenerate the key to find and cancel the request
  const { requestKey } = getRequestDetails(config)
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey)
    controller.abort()
    pendingRequests.delete(requestKey)
    return true
  }
  return false
}

// Helper function to cancel all pending requests
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}



export { instance }
