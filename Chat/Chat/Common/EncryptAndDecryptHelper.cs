namespace Chat.Common
{
    using System.Configuration;
    using Chat.Services;

    public static class EncryptAndDecryptPasswordHelper
    {
        public static string EncryptPassword(string password)
        {
            var SecretWord = ConfigurationManager.AppSettings["SecretWord"];
            var EncryptedPass = EncryptAndDecrypt.Encrypt(password, SecretWord);

            return EncryptedPass;
        }
    }
}