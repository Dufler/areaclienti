package it.ltc.servlet;

import java.io.IOException;

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
import it.ltc.utility.HashUtility;

/**
 * Servlet implementation class ReimpostaNuovaPasswordServlet
 */
@WebServlet(description = "Prende in ingresso la nuova password scelta per l'account", urlPatterns = { "/reimpostaPassword/reimpostaNuovaPassword" })
public class ReimpostaNuovaPasswordServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(ReimpostaNuovaPasswordServlet.class);
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ReimpostaNuovaPasswordServlet() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		ServletContext application = getServletContext();
		String username = request.getParameter("username");
		String risorsa = request.getParameter("risorsa");
		String nuovaPassword = request.getParameter("password");
		logger.info("L'utente " + username + " ha richiesto di reimpostare la sua password.");
		EntityManager<Utente> manager = new EntityManager<Utente>(Utente.class, Database.PRODUZIONE);
		manager.setLogger(logger, EntityManager.LOG_LEVEL_INFO);
		Utente filtro = new Utente();
		filtro.setUsername(username);
		filtro.setRisorsaTemporanea(risorsa);
		Utente account = manager.getEntity(filtro);
		if (account != null) {
			account.setPassword(HashUtility.getHash(nuovaPassword));
			account.setRisorsaTemporanea(null);
			account.setScadenzaRisorsa(null);
			manager.update(account, filtro);
			logger.info("Password reimpostata.");
		}		
		response.sendRedirect(application.getContextPath());
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
