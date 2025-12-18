using EduPortal.Api.Data;
using EduPortal.Api.DTOs;
using EduPortal.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EduPortal.Api.Services;

public class AuthService : IAuthService
{
    private readonly EduPortalDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(EduPortalDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return new LoginResponse
        {
            Token = GenerateJwtToken(user),
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> RegisterAsync(RegisterRequest request)
    {
        // Check if username already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (existingUser != null)
        {
            Console.WriteLine($"⚠️ Registration failed: Username '{request.Username}' already exists");
            return null;
        }

        Console.WriteLine($"✅ Creating new {request.Role} user: {request.Username}");
        
        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Name = request.Name,
            Email = $"{request.Username}@eduportal.com",
            Role = request.Role.ToLower() == "teacher" ? UserRole.Teacher : UserRole.Student
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        Console.WriteLine($"✅ User {request.Username} registered successfully as {user.Role}");
        return MapToUserDto(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user == null ? null : MapToUserDto(user);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user == null ? null : MapToUserDto(user);
    }

    private string GenerateJwtToken(User user)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role.ToString().ToLower(),
        CreatedAt = user.CreatedAt
    };
}
