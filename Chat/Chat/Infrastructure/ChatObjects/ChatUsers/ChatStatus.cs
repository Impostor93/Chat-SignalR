using System;
using Chat.Common;

namespace Chat.Infrastructure.ChatObjects.ChatUsers
{
    

    public class ChatStatus
    {
        #region Member

        private String statusName = String.Empty;
        private Boolean canMakeOperation = false;
        private String statusImage = String.Empty;
        private int _IdStaut = (int)TypeStatus.OffLine;

        #endregion Member

        #region Properties

        public String StatusName
        {
            get { return statusName; }
            set { statusName = value; }
        }

        public Boolean CanMakeOperation
        {
            get { return canMakeOperation; }
            set { canMakeOperation = value; }
        }

        public String StatusImage
        {
            get { return statusImage; }
            set { statusImage = value; }
        }

        public Int32 IdStaut
        {
            get { return _IdStaut; }
            set { _IdStaut = value; }
        }

        #endregion Properties

        public ChatStatus()
        {
            statusName = "OffLine";
            canMakeOperation = true;
            statusImage = "offline.png";
            _IdStaut = (int)TypeStatus.OffLine;
        }

        public ChatStatus(TypeStatus IdStatus)
        {
            ChangeStatus(IdStatus);
        }

        public void ChangeStatus(TypeStatus idStatus)
        {
            switch (idStatus)
            {
                case TypeStatus.OffLine: statusName = "OffLine";
                    canMakeOperation = true;
                    statusImage = "offline.png";
                    _IdStaut = (int)idStatus;
                    break;

                case TypeStatus.OnLine: statusName = "OnLine";
                    canMakeOperation = true;
                    statusImage = "online.png";
                    _IdStaut = (int)idStatus;
                    break;
            }
        }
    }
}