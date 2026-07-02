# Test Credentials

## Demo User Credentials

All tests use the following canonical demo credentials:

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `DemoPass1!` |

## Environment Variables

For local testing, set the following in your `.env` file:

```bash
# Test user credentials (must match backend configuration)
TEST_USER_EMAIL=demo@example.com
TEST_USER_PASSWORD=DemoPass1!

# Frontend URL (default: http://localhost:5173)
FRONTEND_URL=http://localhost:5173

# Backend URL (default: varies by stack)
BACKEND_URL=http://localhost:8080
```

## Bruno Tests

Bruno tests automatically use these credentials in `login.bru`. No configuration needed.

## Playwright Tests

Playwright fixtures use these credentials by default. Override via environment variables if needed:

```bash
export TEST_USER_EMAIL=demo@example.com
export TEST_USER_PASSWORD=DemoPass1!
npx playwright test
```

## Backend Configuration

Ensure your backend authentication service accepts these credentials. Example Spring Security configuration:

```java
@Bean
public UserDetailsService userDetailsService() {
    UserDetails demoUser = User.builder()
        .username("demo@example.com")
        .password(passwordEncoder().encode("DemoPass1!"))
        .roles("USER")
        .build();
    return new InMemoryUserDetailsManager(demoUser);
}
```
