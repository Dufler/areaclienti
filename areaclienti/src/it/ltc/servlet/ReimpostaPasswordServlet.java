package it.ltc.servlet;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import it.ltc.logica.database.configuration.Database;
import it.ltc.logica.database.model.centrale.utenti.Utente;
import it.ltc.logica.database.orm.EntityManager;
import it.ltc.utility.FileUtility;
import it.ltc.utility.HashUtility;
import it.ltc.utility.mail.Email;
import it.ltc.utility.mail.MailMan;

/**
 * Servlet implementation class ReimpostaPasswordServlet
 */
@WebServlet(description = "La servlet chiamata per reimpostare la password", urlPatterns = { "/reimposta" })
public class ReimpostaPasswordServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(ReimpostaPasswordServlet.class);
	private static final long serialVersionUID = 1L;
	
	private static final long durataRisorsa = 86400000; //24 ore
	private static final String indirizzoRisorseTemporanee = "http://traffic.services.ltc-logistics.it/areaclienti/reimpostaPassword/";
	private static final String indirizzoMail = "sysinfo@ltc-logistics.it";
	private static final String passwordMail = "ltc10183";
	private static final String indirizzoMailDestinario = "support@ltc-logistics.it";
	private static final String oggettoMail = "Reimposta la password LTC";
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ReimpostaPasswordServlet() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		ServletContext application = getServletContext();
		String mail = request.getParameter("mail");
		logger.info("Ricevuta richiesta di reimpostare la password per l'account: " + mail);
		boolean reimposta = reimposta(mail);
		String filePath;
		if (reimposta) {
			filePath = application.getRealPath("WEB-INF/html/OK.html");
			logger.info("Creata la risorsa temporanea e spedita una mail");
		} else {
			filePath = application.getRealPath("WEB-INF/html/MailNonTrovata.html");
			logger.info("Nessun account corrispondente trovato");
		}
		String page = FileUtility.readFile(filePath);
		response.getWriter().append(page);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	private boolean reimposta(String mail) {
		boolean reimposta = false;	
		EntityManager<Utente> manager = new EntityManager<Utente>(Utente.class, Database.PRODUZIONE);
		manager.setLogger(logger, EntityManager.LOG_LEVEL_INFO);
		Utente filtro = new Utente();
		filtro.setEmail(mail);
		Utente account = manager.getEntity(filtro, true);
		if (account != null) {
			logger.debug("Trovato l'account corrispondente");
			Date now = new Date();
			String path = HashUtility.getHash(now.toString());
			long expiration = now.getTime() + durataRisorsa;
			now.setTime(expiration);
			account.setRisorsaTemporanea(path);
			account.setScadenzaRisorsa(now);
			int righe = manager.update(account, filtro);
			if (righe == 1) {
				logger.debug("Invio del messaggio contenente il link per reimpostare la password");
				boolean invio = inviaMail(account, path);
				if (invio) {
					reimposta = true;
					logger.debug("Procedura completa");
				}
			}
		}
		return reimposta;
	}
	
	private boolean inviaMail(Utente account, String path) {
		String corpo = "Salve " + account.getUsername() + ",\n\r";
		corpo += "a questo indirizzo:\n\r";
		corpo += indirizzoRisorseTemporanee + path + "\n\r";
		corpo += "puoi reimpostare la tua password.\n\r\n\r";
		corpo += "Cordiali saluti,\n\r";
		corpo += "L&TC";
		List<String> destinatari = new ArrayList<String>();
		destinatari.add(indirizzoMailDestinario);
		destinatari.add(account.getEmail());
		MailMan postino = new MailMan(indirizzoMail, passwordMail, true);
		Email email = new Email(oggettoMail, corpo);		
		return postino.invia(destinatari, email);
	}

}
