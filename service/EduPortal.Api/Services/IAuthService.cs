using EduPortal.Api.DTOs;

namespace EduPortal.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserDto?> RegisterAsync(RegisterRequest request);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<UserDto?> GetCurrentUserAsync(string userId);
}
