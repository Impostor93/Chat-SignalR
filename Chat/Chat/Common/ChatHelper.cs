using System;

namespace Chat.Common
{
    public static class ChatHelper
    {
        public static bool IsGuidNullOrEmpty(Guid identifier) { return identifier == null || identifier == Guid.Empty; }

        public static Guid ConvertStringToGuid(string identifier)
        {
            Guid guidIdentifier;
            if (!Guid.TryParse(identifier, out guidIdentifier))
                throw new FormatException("Unable to convert string into guid.");

            return guidIdentifier;
        }
    }
}