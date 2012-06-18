<?php
include('openinviter.php');
$inviter=new OpenInviter();
$oi_services=$inviter->getPlugins();

$step='get_contacts';
$contacts=array();
$contents='';


if ($_SERVER['REQUEST_METHOD']=='GET')
	{
	if (empty($_GET['email_box']))
		return;
	if (empty($_GET['password_box']))
		return;
	if (empty($_GET['provider_box']))
		return;

	$inviter->startPlugin($_GET['provider_box']);
	$internal=$inviter->getInternalError();
	if ($internal) 
		{
		$ers['inviter']=$internal;
		}
	elseif (!$inviter->login($_GET['email_box'],$_GET['password_box'])) 
		{
		$internal=$inviter->getInternalError();
		$ers['login']=($internal?$internal:"Login failed. Please check the email and password you have provided and try again later !");
		}
	elseif (false===$contacts=$inviter->getMyContacts())
		{
		$ers['contacts']="Unable to get contacts !";
		}
	else
		{
		$import_ok=true;
		$step='send_invites';
		$_GET['oi_session_id']=$inviter->plugin->getSessionID();
		$_GET['message_box']='';
		}
	}

if ($inviter->showContacts())
	{
	if (count($contacts)==0)
		$contents.="NONE";
	else
		{
		$odd=true;$counter=0;
		foreach ($contacts as $email=>$name)
			{
			$counter++;
			if ($odd) $class='thTableOddRow'; else $class='thTableEvenRow';
			$contents.="{$name},{$email};";
			$odd=!$odd;
			}
		}
	}
	
echo $contents;	
?>