# API REST Documentation

This documentation provides an overview of the API endpoints and functionality of the RESTful API. The API serves as a backend for managing games and user authentication. Below, you will find information about the available endpoints, their usage, and any required authentication.

## API Base URL

The base URL for this API is typically `http://localhost:8080`. Ensure that you replace it with the appropriate URL if the API is hosted on a different domain.

## Authentication

Some endpoints in this API require authentication using a JSON Web Token (JWT). To access protected endpoints, you must include a valid JWT token in the `Authorization` header as follows:

```http
Authorization: Bearer <JWT-Token>
```

The JWT token is obtained during the login process and should be included with your requests to authorized endpoints.

User
Create User
Endpoint: POST /users/create
Description: Create a new user account.
Request Body:

```
{
  "name": "User Name",
  "username": "username",
  "email": "user@example.com",
  "password": "userpassword"
}
```

Response: Returns the newly created user if successful.
User Login
Endpoint: POST /authenticate
Description: Authenticate a user to obtain a JWT token.
Request Body:

```
{
  "emailOrUsername": "user@example.com", // Email or username
  "password": "userpassword"
}
```

Response: Returns a JWT token if authentication is successful.
Forgot Password
Endpoint: POST /forgot-password
Description: Initiates the password reset process by sending an email to the user.
Request Body:

```
{
  "email": "user@example.com"
}
```

Response: Sends an email with a reset password link if the email exists.
Reset Password
Endpoint: POST /reset-password/:token
Description: Reset the user's password using a valid token.
Request Body:

```
{
  "newPassword": "newpassword"
}
Authentication: Requires a valid JWT token.
Response: Returns the newly added game if successful.
Update Game
Endpoint: PUT /game/:id
Description: Update an existing game by its ID.
URL Parameters:
id (integer): The ID of the game to update.
Request Body: JSON object containing the fields to update.
Authentication: Requires a valid JWT token.
Response: Returns a success status if the update is successful.
Delete Game
Endpoint: DELETE /game/:id
Description: Delete a game by its ID.
URL Parameters:
id (integer): The ID of the game to delete.
Authentication: Requires a valid JWT token.
Response: Returns a success status if the deletion is successful.
Error Responses
In case of any errors, the API will respond with the appropriate status code and error message. Be sure to handle these error responses in your application.

Example Usage
Here's an example of how to use the API endpoints with authentication:

Create a user account:
```

POST /users/create
{
"name": "John Doe",
"username": "johndoe",
"type": "client",
"email": "john@example.com",
"password": "password123"
}

```
Log in to obtain a JWT token:
```

POST /authenticate
{
"emailOrUsername": "john@example.com",
"password": "password123"
}

```
Use the JWT token to access protected endpoints:
```

Remember to replace <JWT-Token> with the actual token obtained during login.

## DB

```
CREATE USER 'reactnative'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'reactnative'@'%';
FLUSH PRIVILEGES;
```
```
CREATE DATABASE reactnative
```
```
./create_env.sh
```