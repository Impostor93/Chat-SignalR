using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Chat.Infrastructure
{
    public enum IdTypeStatus : int
    { 
        OnLine = 1,
        OffLine = 2
    }

    public class ChatStatus
    {
        #region Member
            String statusName = String.Empty;
            Boolean canMakeOperation = false;
            String statusImage = String.Empty;
            int _IdStaut = (int)IdTypeStatus.OffLine;
        #endregion
        
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
        #endregion
        
        public ChatStatus()
        {
            statusName = "OffLine";
            canMakeOperation = true;
            statusImage = "offline.png";
            _IdStaut = (int)IdTypeStatus.OffLine;
        }
        public ChatStatus(IdTypeStatus IdStatus)
        {
            ChangeStatus(IdStatus);
        }

        public void ChangeStatus(IdTypeStatus idStatus)
        {
            switch (idStatus)
            {
                case IdTypeStatus.OffLine: statusName = "OffLine";
                                            canMakeOperation = true;
                                            statusImage = "offline.png";
                                            _IdStaut = (int)idStatus;
                                             break;

                case IdTypeStatus.OnLine: statusName = "OnLine";
                                             canMakeOperation = true;
                                             statusImage = "online.png";
                                             _IdStaut = (int)idStatus;
                                             break;

            }
        }
    }
}