import React, { useEffect, useState } from 'react';
import { Col, Row } from 'reactstrap';
import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import "flatpickr/dist/themes/material_blue.css";

const Section = (props:any) => {
    useEffect(() => {
        if (typeof props.rightClickBtn === 'function') {
          props.rightClickBtn(false); // chama a função com false ao montar o componente
        }
      }, []);

      const today = new Date();

      const [range, setRange] = useState([today, today]);
   
    return (
        <React.Fragment>
            <Row className="mb-3 pb-1">
                <Col xs={12}>
                    <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                        <div className="flex-grow-1">
                            <h4 className="fs-16 mb-1">Bom Dia, Leonardo!</h4>
                            <p className="text-muted mb-0">Veja o que está acontecendo com sua loja hoje..</p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <form action="#">
                                <Row className="g-3 mb-0 align-items-center">
                                    <div className="col-sm-auto">
                                        <div className="input-group">
                                        <Flatpickr
                                            className="form-control border-0 dash-filter-picker shadow"
                                            options={{
                                                mode: "range",
                                                dateFormat: "d/m/Y",
                                                locale: Portuguese,
                                                defaultDate: [today, today]
                                            }}
                                            value={range}
                                            onChange={setRange}
                                            />
                                            <div className="input-group-text bg-primary border-primary text-white"><i className="ri-calendar-2-line"></i></div>
                                        </div>
                                    </div>
                                    {/* <div className="col-auto">
                                        <button type="button" className="btn btn-soft-success"><i className="ri-add-circle-line align-middle me-1"></i> Add Product</button>
                                    </div> */}
                                    {/* <div className="col-auto">
                                        <button type="button" className="btn btn-soft-info btn-icon waves-effect waves-light layout-rightside-btn" onClick={props.rightClickBtn} ><i className="ri-pulse-line"></i></button>
                                    </div> */}
                                </Row>
                            </form>
                        </div>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default Section;