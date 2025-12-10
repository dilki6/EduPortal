using EduPortal.Api.DTOs;
using EduPortal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result == null ? Unauthorized(new { message = "Invalid username or password" }) : Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return result == null ? BadRequest(new { message = "Username or email already exists" }) : Ok(result);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var user = await _authService.GetUserByIdAsync(userId);
        return user == null ? NotFound(new { message = "User not found" }) : Ok(user);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        var user = await _authService.GetCurrentUserAsync(userId);
        return user == null ? NotFound(new { message = "User not found" }) : Ok(user);
    }

    [HttpGet("debug/me")]
    [Authorize]
    public IActionResult DebugMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var username = User.FindFirstValue(ClaimTypes.Name);
        var role = User.FindFirstValue(ClaimTypes.Role);
        
        return Ok(new
        {
            userId,
            username,
            role,
            claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList(),
            isAuthenticated = User.Identity?.IsAuthenticated ?? false
        });
    }
}