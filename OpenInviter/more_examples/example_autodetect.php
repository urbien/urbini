<?php
$contents="<html>
<head>
<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js' type='text/javascript' charset='utf-8'></script>
<script src='js/jquery.uniform.min.js' type='text/javascript' charset='utf-8'></script>
<script type='text/javascript' charset='utf-8'>
  $(function(){
	$('input, textarea, select, button').uniform();
  });
</script>
<link rel='stylesheet' href='css/uniform.default.css' type='text/css' media='screen'>
<style type='text/css' media='screen'>
body {
font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
color: #666;
padding: 40px;
}
h1 {
margin-top: 0;
}
ul {
list-style: none;
padding: 0;
margin: 0;
}
li {
margin-bottom: 20px;
clear: both;
}
label {
font-size: 10px;
font-weight: bold;
text-transform: uppercase;
display: block;
margin-bottom: 3px;
clear: both;
}
</style>
</head>
";
include('../openinviter.php');
$inviter=new OpenInviter();
$oi_services=$inviter->getPlugins();
function ers($ers)
	{
	if (!empty($ers))
		{
		$contents="<table cellspacing='0' cellpadding='0' style='border:1px solid red;' align='center'><tr><td valign='middle' style='padding:3px' valign='middle'><img src='imgs/ers.gif'></td><td valign='middle' style='color:red;padding:5px;'>";
		foreach ($ers as $key=>$error)
			$contents.="{$error}<br >";
		$contents.="</td></tr></table><br >";
		return $contents;
		}
	}
	
function oks($oks)
	{
	if (!empty($oks))
		{
		$contents="<table border='0' cellspacing='0' cellpadding='10' style='border:1px solid #5897FE;' align='center'><tr><td valign='middle' valign='middle'><img src='imgs/oks.gif' ></td><td valign='middle' style='color:#5897FE;padding:5px;'>	";
		foreach ($oks as $key=>$msg)
			$contents.="{$msg}<br >";
		$contents.="</td></tr></table><br >";
		return $contents;
		}
	}

if (!empty($_POST['step'])) $step=$_POST['step'];
else $step='get_contacts';

$ers=array();$oks=array();$import_ok=false;$done=false;
if ($_SERVER['REQUEST_METHOD']=='POST')
	{
	if ($step=='get_contacts')
		{
		if (empty($_POST['email_box'])) $ers['email']="Email missing !";
		else{
			$provider=$inviter->getPluginByDomain($_POST['email_box']);
			if (!empty($provider))
				{
				if (isset($oi_services['email'][$provider])) $plugType='email';
				elseif (isset($oi_services['social'][$provider])) $plugType='social';
				else $plugType='';
				}
			else $ers['email']="Email missing !";
			}
		if (empty($_POST['password_box'])) $ers['password']="Password missing !";		
		if (count($ers)==0)
			{			
			$inviter->startPlugin($provider);
			$internal=$inviter->getInternalError();
			if ($internal)
				$ers['inviter']=$internal;
			elseif (!$inviter->login($_POST['email_box'],$_POST['password_box']))
				{
				$internal=$inviter->getInternalError();
				$ers['login']=($internal?$internal:"Login failed. Please check the email and password you have provided and try again later !");
				}
			elseif (false===$contacts=$inviter->getMyContacts())
				$ers['contacts']="Unable to get contacts !";
			else
				{
				$import_ok=true;
				$step='send_invites';
				$_POST['oi_session_id']=$inviter->plugin->getSessionID();
				$_POST['message_box']='';
				}
			}
		}
	elseif ($step=='send_invites')
		{
		if (!empty($_POST['email_box'])) $provider=$inviter->getPluginByDomain($_POST['email_box']);
		if (empty($provider)) $ers['provider']='Provider missing !';
		else
			{
			$inviter->startPlugin($provider);
			$internal=$inviter->getInternalError();
			if ($internal) $ers['internal']=$internal;
			else
				{
				if (empty($_POST['email_box'])) $ers['inviter']='Inviter information missing !';
				if (empty($_POST['oi_session_id'])) $ers['session_id']='No active session !';
				if (empty($_POST['message_box'])) $ers['message_body']='Message missing !';
				else $_POST['message_box']=strip_tags($_POST['message_box']);
				$selected_contacts=array();$contacts=array();
				$message=array('subject'=>$inviter->settings['message_subject'],'body'=>$inviter->settings['message_body'],'attachment'=>"\n\rAttached message: \n\r".$_POST['message_box']);
				if ($inviter->showContacts())
					{
					foreach ($_POST as $key=>$val)
						if (strpos($key,'check_')!==false)
							$selected_contacts[$_POST['email_'.$val]]=$_POST['name_'.$val];
						elseif (strpos($key,'email_')!==false)
							{
							$temp=explode('_',$key);$counter=$temp[1];
							if (is_numeric($temp[1])) $contacts[$val]=$_POST['name_'.$temp[1]];
							}
					if (count($selected_contacts)==0) $ers['contacts']="You haven't selected any contacts to invite !";
					}
				}
			}
		if (count($ers)==0)
			{
			$sendMessage=$inviter->sendMessage($_POST['oi_session_id'],$message,$selected_contacts);
			$inviter->logout();
			if ($sendMessage===-1)
				{
				$message_footer="\r\n\r\nThis invite was sent using OpenInviter technology.";
				$message_subject=$_POST['email_box'].$message['subject'];
				$message_body=$message['body'].$message['attachment'].$message_footer; 
				$headers="From: {$_POST['email_box']}";
				foreach ($selected_contacts as $email=>$name)
					mail($email,$message_subject,$message_body,$headers);
				$oks['mails']="Mails sent successfully";
				}
			elseif ($sendMessage===false)
				{
				$internal=$inviter->getInternalError();
				$ers['internal']=($internal?$internal:"There were errors while sending your invites.<br>Please try again later!");
				}
			else $oks['internal']="Invites sent successfully!";
			$done=true;
			}
		}
	}
else
	{
	$_POST['email_box']='';
	$_POST['password_box']='';
	}

$contents.="<script type='text/javascript'>
	function toggleAll(element) 
	{
	var form = document.forms.openinviter, z = 0;
	for(z=0; z<form.length;z++)
		{
		if(form[z].type == 'checkbox')
			form[z].checked = element.checked;
	   	}
	}
</script>";
$contents.="<form action='' method='POST' name='openinviter'>".ers($ers).oks($oks);
if (!$done)
	{
	if ($step=='get_contacts')
		{
		$contents.="<table align='center' class='thTable' cellspacing='2' cellpadding='0' style='border:none;'>
			<tr><td align='right'><label for='email_box'>Email</label></td><td><input type='text' name='email_box' value='{$_POST['email_box']}'></td></tr>
			<tr><td align='right'><label for='password_box'>Password</label></td><td><input type='password' name='password_box' value='{$_POST['password_box']}'></td></tr>			
			<tr><td colspan='2' align='center'><input type='submit' name='import' value='Import Contacts'></td></tr>
		</table><input type='hidden' name='step' value='get_contacts'>";
		}
	else
		$contents.="<table class='thTable' cellspacing='0' cellpadding='0' style='border:none;'>
				<tr><td align='center' valign='top'><label for='message_box'>Message</label></td><td><textarea rows='5' cols='50' name='message_box' style='width:300px;'>{$_POST['message_box']}</textarea></td></tr>
				<tr><td align='center' colspan='2'><input type='submit' name='send' value='Send Invites' ></td></tr>
			</table>";
	}
$contents.="<center><a href='http://openinviter.com/'><img src='http://openinviter.com/images/banners/banner_blue_1.gif?nr=118' border='0' alt='Powered by OpenInviter.com' title='Powered by OpenInviter.com'></a></center>";
if (!$done)
	{
	if ($step=='send_invites')
		{		
		if ($inviter->showContacts())
			{			
			$contents.="<table align='center' cellspacing='0' cellpadding='0'><tr><td colspan='".($plugType=='email'? "3":"2")."'>Your contacts</td></tr>";
			if (count($contacts)==0)
				$contents.="<tr><td align='center' style='padding:20px;' colspan='".($plugType=='email'? "3":"2")."'>You do not have any contacts in your address book.</td></tr>";
			else
				{
				$contents.="<tr><td><input type='checkbox' onChange='toggleAll(this)' name='toggle_all' title='Select/Deselect all' checked>Invite?</td><td>Name</td>".($plugType == 'email' ?"<td>E-mail</td>":"")."</tr>";
				$counter=0;
				foreach ($contacts as $email=>$name)
					{
					$counter++;					
					$contents.="<tr><td><input name='check_{$counter}' value='{$counter}' type='checkbox' checked><input type='hidden' name='email_{$counter}' value='{$email}'><input type='hidden' name='name_{$counter}' value='{$name}'></td><td>{$name}</td>".($plugType == 'email' ?"<td>{$email}</td>":"")."</tr>";
					}
				$contents.="<tr><td colspan='".($plugType=='email'? "3":"2")."' style='padding:3px;'><input type='submit' name='send' value='Send invites'></td></tr>";
				}
			$contents.="</table>";
			}
		$contents.="<input type='hidden' name='step' value='send_invites'>
			<input type='hidden' name='email_box' value='{$_POST['email_box']}'>
			<input type='hidden' name='oi_session_id' value='{$_POST['oi_session_id']}'>";
		$contents.="<script>self.parent.$.fancybox.resize();</script>";
		}
	}
$contents.="</form>";
echo $contents;
?>