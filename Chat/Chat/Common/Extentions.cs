using System;
namespace Chat.Common
{
    public static class Extentions
    {
        public static bool IsNullOrEmpty(this Guid indentifier) { return indentifier == null || indentifier == Guid.Empty; }
    }
}