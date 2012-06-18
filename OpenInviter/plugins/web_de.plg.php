<?php
$_pluginInfo=array(
	'name'=>'Web.de',
	'version'=>'1.0.7',
	'description'=>"Get the contacts from an web.de account",
	'base_version'=>'1.8.4',
	'type'=>'email',
	'check_url'=>'http://m.web.de',
	'requirement'=>'user',
	'allowed_domains'=>false,
	'imported_details'=>array('first_name','email_1'),
	);
/**
 * web.de Plugin
 * 
 * Imports user's contacts from web.de's AddressBook
 * 
 * @author OpenInviter
 * @version 1.8.4
 */
class web_de extends openinviter_base
	{
	private $login_ok=false;
	public $showContacts=true;
	protected $timeout=30;
	protected $userAgent='Mozilla/4.1 (compatible; MSIE 5.0; Symbian OS; Nokia 3650;424) Opera 6.10  [en]';
	public $debug_array=array(
			 'initial_get'=>'h_cell_r',
			 'url_mail'=>'password',
			 'post_login'=>'newmail;jsessionid',
			 'new_email'=>'interface',
			 'address_boock'=>'Privat'
	    	);
	
	/**
	 * Login function
	 * 
	 * Makes all the necessary requests to authenticate
	 * the current user to the server.
	 * 
	 * @param string $user The current user.
	 * @param string $pass The password for the current user.
	 * @return bool TRUE if the current user was authenticated successfully, FALSE otherwise.
	 */
	public function login($user,$pass)
		{
		$this->resetDebugger();
		$this->service='web_de';
		$this->service_user=$user;
		$this->service_password=$pass;
		if (!$this->init()) return false;
		$res=$this->get("https://m.web.de/?uim_redirect=true");
		if ($this->checkResponse('initial_get',$res)) $this->updateDebugBuffer('initial_get',"https://m.web.de/?uim_redirect=true",'GET');
		else{
			$this->updateDebugBuffer('initial_get',"https://m.web.de/?uim_redirect=true",'GET',false);
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		$urlMail='https://m.web.de'.$this->getElementString($res,'h_cell_r"><a href="','"');
		$res=$this->get($urlMail,true);
		if ($this->checkResponse('url_mail',$res)) $this->updateDebugBuffer('url_mail',$urlMail,'GET');
		else{
			$this->updateDebugBuffer('url_mail',$urlMail,'GET',false);
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		$form_action=$this->getElementString($res,'<form action="','"');		
		$post_elements=$this->getHiddenElements($res);		
		$post_elements['username']=$user;
		$post_elements['password']=$pass;
		$post_elements['sv-remove-name']='Login';
		$res=$this->post($form_action,$post_elements,true);		
		if ($this->checkResponse("post_login",$res)) $this->updateDebugBuffer('post_login',$form_action,'POST');
		else{
			$this->updateDebugBuffer('post_login',$form_action,'POST',$post_elements);
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		$newMail='https://mm.web.de/newmail;jsessionid='.$this->getElementString($res,'href="newmail;jsessionid=','"');
		$res=$this->get($newMail,true);
		if ($this->checkResponse('new_email',$res)) $this->updateDebugBuffer('new_email',$newMail,'GET');
		else{
			$this->updateDebugBuffer('new_email',$newMail,'GET',false);
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}		
		$this->login_ok="https://mm.web.de/newmail?wicket:interface=:2:mail-form::IFormSubmitListener::";
		return true;
		}
	
	/**
	 * Get the current user's contacts
	 * 
	 * Makes all the necesarry requests to import
	 * the current user's contacts
	 * 
	 * @return mixed The array if contacts if importing was successful, FALSE otherwise.
	 */	
	public function getMyContacts()
		{
		if (!$this->login_ok)
			{
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		else
		$url=$this->login_ok;
		$contacts=array();	
		$form_action=$url;
		$post_elements=array("id4_hf_0"=>"",
							 "write-mail-section:mail-from"=>0,
                             "mail-to"=>"",
                             "write-mail-section:fieldset:add-to.x"=>14,
                             "write-mail-section:fieldset:add-to.y"=>16,
                             "write-mail-section:fieldset:add-to"=>"to",
                             "write-mail-section:mail-subject"=>"",
                             "write-mail-section:mail-body"=>""
                             );
		$res=$this->post($form_action,$post_elements,true);
		if ($this->checkResponse('address_boock',$res)) $this->updateDebugBuffer('address_boock',$form_action,'POST');
		else{
			$this->updateDebugBuffer('address_boock',$form_action,'POST',$post_elements);
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		preg_match_all("#\<td colspan\=\"2\"\>\<b\>(.+)\<\/b\>\<\/td\>#U",$res,$names);
		preg_match_all("#\<small\>Privat\: (.+)\<\/small\>#U",$res,$emails);		
		if (!empty($emails))
			foreach($emails[1] as $id=>$email)
				if (!empty($names[1][$id])) $contacts[$email]=array('email_1'=>$email,'first_name'=>$names[1][$id]);
		foreach ($contacts as $email=>$name) if (!$this->isEmail($email)) unset($contacts[$email]);
		return $this->returnContacts($contacts);
		}
	
	/**
	 * Terminate session
	 * 
	 * Terminates the current user's session,
	 * debugs the request and reset's the internal 
	 * debudder.
	 * 
	 * @return bool TRUE if the session was terminated successfully, FALSE otherwise.
	 */	
	public function logout()
		{
		if (!$this->checkSession()) return false;
		$res=$this->get("https://mm.web.de/logout",true);		
		$this->debugRequest();
		$this->resetDebugger();
		$this->stopPlugin();
		return true;
		}
				
	}
?>