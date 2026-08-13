using ItHelpdesk.Model;
using System;

namespace ItHelpdesk.Employees
{
    public class Employee : BasicModel
    {
        public decimal ID { get; set; }
        public string EmployeeCode { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? Email { get; set; }
        public string? Sex { get; set; }
        public DateOnly? Birthday { get; set; }
        public string? BirthPlace { get; set; }
        public string? IdentityCard { get; set; }
        public DateOnly? IdentityCardDate { get; set; }
        public string? IdentityCardPlace { get; set; }
        public string? IdentityCard2 { get; set; }
        public DateOnly? IdentityCardDate2 { get; set; }
        public string? IdentityCardPlace2 { get; set; }
        public string? ReligiousCode { get; set; }
        public string? NationalityCode { get; set; }
        public string? EducatedCode { get; set; }
        public DateOnly? PayDate { get; set; }
        public double? ManagerId { get; set; }
        public bool? IsFederation { get; set; }
        public string? DepartmentCode { get; set; }
        public string? CompetenceCode { get; set; }
        public string? JobCode { get; set; }
        public DateOnly? DateOfWork { get; set; }
        public DateOnly? DateOfEntry { get; set; }
        public int? FamilyExemptionNumber { get; set; }
        public DateOnly? FamilyExemptionDate { get; set; }
        public string? TaxYourself { get; set; }
        public bool? IsInactivity { get; set; }
        public string? BankAccount { get; set; }
        public string? BankCode { get; set; }
        public string? PermanentAddress { get; set; }
        public string? TemporaryAddress { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Image { get; set; }
        public DateOnly? InactivityDate { get; set; }
        public string? InsuranceNumber { get; set; }
        public string? Password { get; set; }
        public bool? IsFirstLogin { get; set; }
        public string? LanguageName { get; set; }
        public string? OtpCde { get; set; }
        public DateTime? OtpExpiresDate { get; set; }
    }
}
