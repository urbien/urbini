<?php
$_pluginInfo=array(
	'name'=>'Abv',
	'version'=>'1.0.7',
	'description'=>"Get the contacts from a Abv account",
	'base_version'=>'1.8.4',
	'type'=>'email',
	'check_url'=>'http://m.abv.bg',
	'requirement'=>'email',
	'allowed_domains'=>array('/(abv.bg)/i','/(gyuvetch.bg)/i','/(gbg.bg)/i'),
	'imported_details'=>array('first_name','email_1')
	);
/**
 * Abv Plugin
 * 
 * Imports user's contacts from Abv AddressBook
 * 
 * @author OpenInviter
 * @version 1.0.0
 */
class abv extends openinviter_base
	{
	private $login_ok=false;
	public $showContacts=true;
	public $internalError=false;
	protected $timeout=30;
	protected $userAgent='Mozilla/4.1 (compatible; MSIE 5.0; Symbian OS; Nokia 3650;424) Opera 6.10  [en]';
	
	public $debug_array=array(
				'initial_get'=>'mobile',
				'login_post'=>'location.replace("',
				'first_redirect'=>'jsessionid',
				'home_page'=>'accesskey',
				'contacts'=>'CNT_ID_BB'	
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
		$this->service='abv';
		$this->service_user=$user;
		$this->service_password=$pass;
		if (!$this->init()) return false;
					
		$res=$this->get("http://m.abv.bg/");
		if ($this->checkResponse("initial_get",$res))
			$this->updateDebugBuffer('initial_get',"http://www.abv.bg/",'GET');
		else
			{
			$this->updateDebugBuffer('initial_get',"http://www.abv.bg/",'GET',false);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
	
		$form_action="https://passport.abv.bg/acct/passport/login";		
		$post_elements=array('service'=>'mobile','username'=>$user,'password'=>$pass);
		$res=$this->post($form_action,$post_elements,true);		
		if ($this->checkResponse('login_post',$res))
			$this->updateDebugBuffer('login_post',$form_action,'POST',true,$post_elements);
		else
			{
			$this->updateDebugBuffer('login_post',$form_action,'POST',false,$post_elements);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		
		$url_redirect=$this->getElementString($res,'location.replace("','"');
		$res=$this->get($url_redirect,true);
		if ($this->checkResponse("first_redirect",$res))
			$this->updateDebugBuffer('first_redirect',"{$url_redirect}",'GET');
		else
			{
			$this->updateDebugBuffer('first_redirect',"{$url_redirect}",'GET',false);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		
		$res=$this->get('http://m.abv.bg/j/home.jsp',true);
		if ($this->checkResponse("home_page",$res))
			$this->updateDebugBuffer('home_page',"http://m.abv.bg/j/home.jsp",'GET');
		else
			{
			$this->updateDebugBuffer('home_page',"http://m.abv.bg/j/home.jsp",'GET',false);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		$contacts_url=$this->getElementString($res,'accesskey="3" href="..','"');		
		$this->login_ok="http://m.abv.bg{$contacts_url}";
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
		else $url=$this->login_ok;
		$contacts=array();
		$res=$this->get($url,true);
		if ($this->checkResponse("contacts",$res))
			$this->updateDebugBuffer('contacts',"{$url}",'GET');
		else
			{
			$this->updateDebugBuffer('contacts',"{$url}",'GET',false);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		if (preg_match_all("#name\=\"CNT\_ID\_BB\" type\=\"checkbox\" value\=\"(.+)\"#U",$res,$ids))
			foreach($ids[1] as $k=>$id)
				{
				 $res=$this->get("http://m.abv.bg/j/contact_preview.jsp?ac=sab&cid={$id}",true);
				 $name=$this->getElementString($res,'<div class="left">','<');
				 $email=$this->getElementString($res,'to=','"');
				 if(!empty($email)) $contacts[$email]=array('first_name'=>$name,'email_1'=>$email);			
				}
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
		$this->get("http://m.abv.bg/j/logout.jsp",true);
		$this->debugRequest();
		$this->resetDebugger();
		$this->stopPlugin();
		return true;	
		}
	
	}	

?>