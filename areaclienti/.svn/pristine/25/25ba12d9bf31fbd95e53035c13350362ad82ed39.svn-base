package it.ltc.servlet;

import java.io.IOException;
import java.util.Date;

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

/**
 * Servlet implementation class RisorsaTemporaneaServlet
 */
@WebServlet(description = "Identifica se all'indirizzo immesso corrisponde una risorsa valida", urlPatterns = { "/reimpostaPassword/*" })
public class RisorsaTemporaneaServlet extends HttpServlet {
	
	private static final Logger logger = Logger.getLogger(RisorsaTemporaneaServlet.class);
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public RisorsaTemporaneaServlet() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		ServletContext application = getServletContext();
		String page;
		String risorsa = request.getRequestURI();
		logger.info("E' stata richiesta la risorsa temporanea: " + risorsa);
		int index = risorsa.lastIndexOf("/");
		risorsa = risorsa.substring(index + 1);
		logger.debug("Estraggo la parte di interesse: " + risorsa);
		EntityManager<Utente> manager = new EntityManager<Utente>(Utente.class, Database.PRODUZIONE);
		Utente filtro = new Utente();
		filtro.setRisorsaTemporanea(risorsa);
		Utente account = manager.getEntity(filtro);
		if (account != null) {
			Date now = new Date();
			logger.info("Ho trovato l'utente corrispondente: " + account.getUsername());
			if (account.getScadenzaRisorsa().after(now)) {
				String filePath = application.getRealPath("WEB-INF/html/ReimpostaPassword.html");
				page = FileUtility.readFile(filePath);
				page = page.replace("XXX", account.getUsername());
				page = page.replace("YYY", account.getRisorsaTemporanea());
			} else {
				//Risorsa scaduta
				String filePath = application.getRealPath("WEB-INF/html/RisorsaNonTrovata.html");
				page = FileUtility.readFile(filePath);
			}			
		} else {
			//Risorsa non disponibile 
			String filePath = application.getRealPath("WEB-INF/html/RisorsaNonTrovata.html");
			page = FileUtility.readFile(filePath);
		}
		response.getWriter().append(page);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
