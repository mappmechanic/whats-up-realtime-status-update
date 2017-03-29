// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables
(function() {
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    var serverUrl = "/",
        members = [],
        pusher = new Pusher('<your-api-key>', {
          authEndpoint: '/usersystem/auth',
          encrypted: true
        }),
        channel,
        userForm = document.getElementById("user-form"),
        memberTemplateStr = document.getElementById('member-template').innerHTML;

    function showEle(elementId){
      document.getElementById(elementId).style.display = 'flex';
    }

    function hideEle(elementId){
      document.getElementById(elementId).style.display = 'none';
    }

    function ajax(url, method, payload, successCallback){
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.onreadystatechange = function () {
        if (xhr.readyState != 4 || xhr.status != 200) return;
        successCallback(xhr.responseText);
      };
      xhr.send(JSON.stringify(payload));
    }

    ajax(serverUrl+"isLoggedIn","GET",{},isLoginChecked);

    function isLoginChecked(response){
      var responseObj = JSON.parse(response);
      if(responseObj.authenticated){
        channel = pusher.subscribe('presence-whatsup-members');
        bindChannelEvents(channel);
      }
      updateUserViewState(responseObj.authenticated);
    }

    function updateUserViewState(isLoggedIn){
      document.getElementById("loader").style.display = "none";
      if(isLoggedIn){
        document.getElementById("logout").style.display = "flex";
        document.getElementById("me").style.display = "flex";
        document.getElementById("signup-form").style.display = "none";
      }else{
        document.getElementById("logout").style.display = "none";
        document.getElementById("me").style.display = "none";
        document.getElementById("signup-form").style.display = "block";
      }
    }

    function showLoader(){
        document.getElementById("loader").style.display = "block";
        document.getElementById("logout").style.display = "none";
        document.getElementById("signup-form").style.display = "none";
    }


    // Adding a new Member Form Submit Event
    userForm.addEventListener("submit", addNewMember);


    function addNewMember(event){
      event.preventDefault();
      var newMember = {
        "username": document.getElementById('display_name').value,
        "status": document.getElementById('initial_status').value
      }
      showLoader();
      ajax(serverUrl+"register","POST",newMember, onMemberAddSuccess);
    }

    function onMemberAddSuccess(response){
        // On Success of registering a new member
        console.log("Success: " + response);
        userForm.reset();
        updateUserViewState(true);
        // Subscribing to the 'presence-members' Channel
        channel = pusher.subscribe('presence-whatsup-members');
        bindChannelEvents(channel);
    }

    // Binding to Pusher Events on our 'presence-whatsup-members' Channel
    
    function bindChannelEvents(channel){
      channel.bind('client-status-update',statusUpdated);
      var reRenderMembers = function(member){
        renderMembers(channel.members);
      }
      channel.bind('pusher:subscription_succeeded', reRenderMembers);
      channel.bind('pusher:member_added', reRenderMembers);
      channel.bind('pusher:member_removed', reRenderMembers);
    }

    // Render the list of members with updated data & also render the logged in user component

    function renderMembers(channelMembers){
      var members = channelMembers.members;
      var membersListNode = document.createElement('div');
      showEle('membersList');

      Object.keys(members).map(function(currentMember){
        if(currentMember !== channelMembers.me.id){
          var currentMemberHtml = memberTemplateStr;
          currentMemberHtml = currentMemberHtml.replace('{{username}}',currentMember);
          currentMemberHtml = currentMemberHtml.replace('{{status}}',members[currentMember].status);
          currentMemberHtml = currentMemberHtml.replace('{{time}}','');
          var newMemberNode = document.createElement('div');
          newMemberNode.classList.add('member');
          newMemberNode.setAttribute("id","user-"+currentMember);
          newMemberNode.innerHTML = currentMemberHtml;
          membersListNode.appendChild(newMemberNode);
        }
      });
      renderMe(channelMembers.me);
      document.getElementById("membersList").innerHTML = membersListNode.innerHTML;
    }
    

    function renderMe(myObj){
      document.getElementById('myusername').innerHTML = myObj.id;
      document.getElementById('mystatus').innerHTML = myObj.info.status;
    }

    // On Blur of editting my status update the status by sending pusher event
    document.getElementById('mystatus').addEventListener('blur',sendStatusUpdateReq);

    function sendStatusUpdateReq(event){
      var newStatus = document.getElementById('mystatus').innerHTML;
      var username = document.getElementById('myusername').innerText;
      channel.trigger("client-status-update", {
        username: username,
        status: newStatus
      });
    }

    // New Update Event Handler
    // We will take the Comment Template, replace placeholders & append to commentsList
    function statusUpdated(data){
      var updatedMemberHtml = memberTemplateStr;
          updatedMemberHtml = updatedMemberHtml.replace('{{username}}',data.username);
          updatedMemberHtml = updatedMemberHtml.replace('{{status}}',data.status);
          updatedMemberHtml = updatedMemberHtml.replace('{{time}}','just now');
      document.getElementById("user-"+data.username).style.color = '#1B8D98';    
      document.getElementById("user-"+data.username).innerHTML=updatedMemberHtml;
      setTimeout(function(){
        document.getElementById("user-"+data.username).style.color = '#000';
      },500);
    }


})();