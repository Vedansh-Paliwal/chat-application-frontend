export const handleApiError = (error) => {
    if (error.response) {
        return error.response.data?.message || "Something went wrong";
    } else if (error.request) {
        return "Server not responding";
    } else {
        return error.message;
    }
};
/*
When Axios throws, it gives you an object like: 
{
  message: "Request failed with status code 400",
  response: { ... },   // 👈 server responded
  request: { ... }     // 👈 request was sent
}

1. error.response → Server replied (most common)
if (error.response)
👉 Means:
Request reached backend ✅
Backend responded ❌ (with error status like 400, 404, 500)
Example:
error.response = {
  status: 400,
  data: "Room already exists"
}

2. error.request → No response from server
else if (error.request)
👉 Means:
Request was sent
But NO response came back 
Reasons:
Backend not running
Wrong port
Network issue

3. Neither → Something broke before request
else
👉 Means:
Request didn’t even go out
Reasons:
Wrong URL (http:localhost typo type stuff)
JS crash
Axios misconfiguration
*/